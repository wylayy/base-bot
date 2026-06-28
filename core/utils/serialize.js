import { normalizeMessageContent, jidNormalizedUser, isJidGroup, getContentType, downloadMediaMessage, isPnUser, isLidUser, getDevice, } from 'baileys';
const MEDIA_TYPE = [
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'documentMessage',
    'stickerMessage',
];
export class MessageContext {
    key;
    chat;
    fromMe;
    flags;
    bot;
    sender;
    permissions;
    body;
    message;
    quoted;
    commands;
    plugins;
    #raw;
    #sock;
    constructor(sock, raw, data) {
        this.#sock = sock;
        this.#raw = raw;
        Object.assign(this, data);
    }
    async reply(text, options = {}) {
        const mentions = text?.match(/@(\d+)/g)?.map((v) => v.replace('@', '') + '@s.whatsapp.net') || [];
        return await this.#sock.sendMessage(this.chat, { text, mentions: [...new Set([...mentions, ...(options.mentions || [])])], ...options }, { quoted: this.#raw });
    }
    async sendImage(image, caption = '', options = {}) {
        const mentions = caption?.match(/@(\d+)/g)?.map((v) => v.replace('@', '') + '@s.whatsapp.net') || [];
        return await this.#sock.sendMessage(this.chat, { image, caption, mentions: [...new Set([...mentions, ...(options.mentions || [])])], ...options }, { quoted: this.#raw });
    }
    async sendVideo(video, caption = '', options = {}) {
        const mentions = caption?.match(/@(\d+)/g)?.map((v) => v.replace('@', '') + '@s.whatsapp.net') || [];
        return await this.#sock.sendMessage(this.chat, { video, caption, mentions: [...new Set([...mentions, ...(options.mentions || [])])], ...options }, { quoted: this.#raw });
    }
    async sendAudio(audio, ptt = false, options = {}) {
        return await this.#sock.sendMessage(this.chat, { audio, ptt, ...options }, { quoted: this.#raw });
    }
    async sendDocument(document, options = {}) {
        const mentions = options.caption?.match(/@(\d+)/g)?.map((v) => v.replace('@', '') + '@s.whatsapp.net') || [];
        return await this.#sock.sendMessage(this.chat, { document, mentions: [...new Set([...mentions, ...(options.mentions || [])])], ...options }, { quoted: this.#raw });
    }
    async sendSticker(sticker, options = {}) {
        return await this.#sock.sendMessage(this.chat, { sticker, ...options }, { quoted: this.#raw });
    }
    async react(emoji) {
        return await this.#sock.sendMessage(this.chat, {
            react: { text: emoji, key: this.key },
        });
    }
    async delete() {
        return await this.#sock.sendMessage(this.chat, { delete: this.key });
    }
    async downloadMedia() {
        const mtype = this.body.mtype;
        const mediaMsg = this.#raw?.message?.[mtype];
        if (mediaMsg?.url && mediaMsg.url.includes('a.whatsapp.net')) {
            mediaMsg.url = mediaMsg.url.replace('a.whatsapp.net', 'mmg.whatsapp.net');
        }
        return await downloadMediaMessage(this.#raw, 'buffer', {}, {
            logger: this.#sock.ws.config.logger,
            reuploadRequest: this.#sock.updateMediaMessage,
        });
    }
}
export default async function ({ id, sock, WAMessage, }) {
    const normalizedMessages = {
        ...WAMessage,
        message: normalizeMessageContent(WAMessage.message),
    };
    const { key, message, broadcast, ...messages } = normalizedMessages;
    const chat = jidNormalizedUser(key.remoteJid || key.remoteJidAlt);
    const botPn = jidNormalizedUser(isPnUser(sock.user.id) ? sock.user.id : sock.user.phoneNumber);
    const botLid = jidNormalizedUser(isLidUser(sock.user.id) ? sock.user.id : sock.user.lid);
    const isGroup = isJidGroup(chat) || false;
    const groupMetadata = isGroup
        ? await sock.getGroupCache(chat)
        : null;
    const senderLid = decodeSender(key, 'lid');
    const senderPn = decodeSender(key, 'pn');
    const sender = key.addressingMode === 'lid' ? senderLid : senderPn;
    const mtype = getContentType(message);
    const text = extractMessageText(message);
    const commandText = text.split(' ')[0].trim();
    const argsText = text.replace(commandText, '').trim();
    const args = argsText ? argsText.split(/ +/) : [];
    const quoted = getQuoted({ key, mtype, message, sock });
    const data = {
        key,
        chat,
        fromMe: key.fromMe,
        device: getDevice(key.id || ''),
        flags: {
            fromMe: key.fromMe,
            isGroup,
            isText: mtype === 'conversation' || mtype === 'extendedTextMessage',
            isSticker: mtype === 'stickerMessage',
            isStickerAnimated: mtype === 'stickerMessage' && !!message?.stickerMessage?.isAnimated,
            isImage: mtype === 'imageMessage',
            isVideo: mtype === 'videoMessage',
            isAudio: mtype === 'audioMessage',
            isDocument: mtype === 'documentMessage',
            isMedia: MEDIA_TYPE.includes(mtype),
        },
        bot: {
            session: id,
            id: botLid || botPn,
            lid: botLid,
            pn: botPn,
        },
        sender: {
            pushName: messages?.pushName || messages?.verifiedBizName || undefined,
            id: senderLid || senderPn,
            lid: senderLid,
            pn: senderPn,
        },
        permissions: {
            sender: {
                superAdmin: isGroup
                    ? IsSender(sender, groupMetadata.participants, ['superadmin'])
                    : false,
                admin: isGroup
                    ? IsSender(sender, groupMetadata.participants, [
                        'superadmin',
                        'admin',
                    ])
                    : false,
            },
            bot: {
                superAdmin: isGroup
                    ? IsSender(groupMetadata.addressingMode === 'lid' ? botLid : botPn, groupMetadata.participants, ['superadmin'])
                    : false,
                admin: isGroup
                    ? IsSender(groupMetadata.addressingMode === 'lid' ? botLid : botPn, groupMetadata.participants, ['superadmin', 'admin'])
                    : false,
            },
        },
        body: {
            mtype,
            rawText: text,
            command: commandText,
            argsText,
            args,
            mentionedJid: message[mtype]?.contextInfo?.mentionedJid || [],
            expiration: message[mtype]?.contextInfo?.expiration || 0,
        },
        message,
        quoted,
        commands: [],
        plugins: {},
    };
    return new MessageContext(sock, WAMessage, data);
}
const decodeSender = (key, type) => {
    let sender;
    if (isJidGroup(key.remoteJid)) {
        if (type === 'lid') {
            sender =
                key.addressingMode === 'lid' ? key.participant : key.participantAlt;
        }
        else if (type === 'pn') {
            sender =
                key.addressingMode === 'pn' ? key.participant : key.participantAlt;
        }
    }
    else {
        if (type === 'lid') {
            sender = key.addressingMode === 'lid' ? key.remoteJid : key.remoteJidAlt;
        }
        else if (type === 'pn') {
            sender = key.addressingMode === 'pn' ? key.remoteJid : key.remoteJidAlt;
        }
    }
    return sender ? jidNormalizedUser(sender) : undefined;
};
const IsSender = (pnOrLid, participants, admin) => {
    return participants.some((participant) => {
        return ((pnOrLid === jidNormalizedUser(participant.id) ||
            pnOrLid === jidNormalizedUser(participant.lid) ||
            pnOrLid === jidNormalizedUser(participant.phoneNumber)) &&
            admin.includes(participant.admin));
    });
};
const extractMessageText = (m) => {
    if (!m)
        return '';
    const msg = m.message ? m.message : m;
    if (!msg)
        return '';
    const type = Object.keys(msg)[0];
    if (!type)
        return '';
    if (type === 'conversation') {
        return msg.conversation || '';
    }
    else if (type === 'extendedTextMessage') {
        return msg.extendedTextMessage.text || '';
    }
    else if (type === 'imageMessage') {
        return msg.imageMessage.caption || '';
    }
    else if (type === 'videoMessage') {
        return msg.videoMessage.caption || '';
    }
    else if (type === 'documentMessage') {
        return msg.documentMessage.caption || '';
    }
    else if (type === 'viewOnceMessage' ||
        type === 'viewOnceMessageV2' ||
        type === 'viewOnceMessageV2Extension') {
        return extractMessageText(msg[type].message);
    }
    else if (type === 'ephemeralMessage') {
        return extractMessageText(msg.ephemeralMessage.message);
    }
    else if (type === 'documentWithCaptionMessage') {
        return extractMessageText(msg.documentWithCaptionMessage.message);
    }
    else if (type === 'buttonsResponseMessage') {
        return msg.buttonsResponseMessage.selectedButtonId || '';
    }
    else if (type === 'templateButtonReplyMessage') {
        return msg.templateButtonReplyMessage.selectedId || '';
    }
    else if (type === 'listResponseMessage') {
        return msg.listResponseMessage.singleSelectReply?.selectedRowId || '';
    }
    else if (type === 'interactiveResponseMessage') {
        const response = msg.interactiveResponseMessage.nativeFlowResponseMessage;
        if (response) {
            return response.paramsJson || '';
        }
        return msg.interactiveResponseMessage.body?.text || '';
    }
    else if (type === 'pollCreationMessage') {
        return msg.pollCreationMessage.name || '';
    }
    else if (type === 'editedMessage') {
        return extractMessageText(msg.editedMessage.message?.protocolMessage?.editedMessage);
    }
    const subObj = msg[type];
    if (subObj && typeof subObj === 'object') {
        if (subObj.text)
            return subObj.text;
        if (subObj.caption)
            return subObj.caption;
        if (subObj.message)
            return extractMessageText(subObj.message);
    }
    return '';
};
const getQuoted = ({ key, mtype, message, sock, }) => {
    const Quoted = message[mtype]?.contextInfo?.quotedMessage;
    if (!Quoted)
        return undefined;
    const contextInfo = message[mtype]?.contextInfo;
    const quotedMessage = normalizeMessageContent(Quoted);
    const type = getContentType(quotedMessage);
    if (!type)
        return undefined;
    const text = extractMessageText(quotedMessage);
    const commandText = text.split(' ')[0].trim();
    const argsText = text.replace(commandText, '').trim();
    const args = argsText ? argsText.split(/ +/) : [];
    const isGroup = isJidGroup(key.remoteJid);
    const keyQuoted = {
        remoteJid: isGroup ? key.remoteJid : contextInfo.participant,
        remoteJidAlt: isGroup ? key.remoteJidAlt : undefined,
        fromMe: contextInfo.participant === jidNormalizedUser(sock?.user?.id) ||
            contextInfo.participant === jidNormalizedUser(sock?.user?.lid),
        id: contextInfo.stanzaId,
        participant: isGroup ? contextInfo.participant : undefined,
        participantAlt: undefined,
        addressingMode: key.addressingMode,
    };
    return {
        key: keyQuoted,
        chat: keyQuoted.remoteJid,
        fromMe: keyQuoted.fromMe,
        flags: {
            fromMe: keyQuoted.fromMe,
            isGroup,
            isText: type === 'conversation' || type === 'extendedTextMessage',
            isSticker: type === 'stickerMessage',
            isStickerAnimated: type === 'stickerMessage' &&
                !!quotedMessage?.stickerMessage?.isAnimated,
            isImage: type === 'imageMessage',
            isVideo: type === 'videoMessage',
            isAudio: type === 'audioMessage',
            isDocument: type === 'documentMessage',
            isMedia: MEDIA_TYPE.includes(type),
        },
        sender: {
            lid: decodeSender(keyQuoted, 'lid'),
            pn: decodeSender(keyQuoted, 'pn'),
            device: getDevice(keyQuoted.id || ''),
        },
        msg: {
            mtype: type,
            rawText: text,
            command: commandText,
            argsText,
            args,
            mentionedJid: contextInfo.mentionedJid,
            expiration: contextInfo?.expiration || 0,
        },
        message: quotedMessage,
        downloadMedia: async function download(WAMessage) {
            const target = WAMessage || this;
            const mediaMsg = target.message?.[type];
            if (mediaMsg?.url && mediaMsg.url.includes('a.whatsapp.net')) {
                mediaMsg.url = mediaMsg.url.replace('a.whatsapp.net', 'mmg.whatsapp.net');
            }
            return await downloadMediaMessage(target, 'buffer', {}, {
                logger: sock.ws.config.logger,
                reuploadRequest: sock.updateMediaMessage,
            });
        },
    };
};
