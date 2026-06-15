import type { BaileysEventMap, WASocket, WAMessage, WAMessageContent, WAMessageKey } from 'baileys';
import { CacheService } from '@lazy-bot/core/services/cache/index';
import { Knex } from 'knex';
declare global {
    interface SerializedMessageExtensions {
    }
    interface CommandExtensions {
    }
    interface MiddlewareExtensions {
    }
    interface EventExtensions {
    }
    interface PluginDataExtensions {
    }
}
export interface PluginManifest {
    name: string;
    version: string;
    description?: string;
    author?: string;
    [key: string]: any;
}
type ExtractInject<T, Path extends string[]> = Path extends [
    infer Head,
    ...infer Tail
] ? Head extends keyof T ? Tail extends string[] ? ExtractInject<T[Head], Tail> : unknown : unknown : T;
export interface SerializedMessage extends Omit<SerializedMessageExtensions, 'flags' | 'bot' | 'sender' | 'permissions' | 'body' | 'quoted'> {
    key: WAMessageKey;
    chat: string;
    fromMe: boolean;
    flags: {
        fromMe: boolean;
        isGroup: boolean;
        isText: boolean;
        isSticker: boolean;
        isImage: boolean;
        isVideo: boolean;
        isAudio: boolean;
        isDocument: boolean;
        isMedia: boolean;
    } & ExtractInject<SerializedMessageExtensions, ['flags']>;
    bot: {
        session: string;
        id: string;
        lid?: string;
        pn?: string;
    } & ExtractInject<SerializedMessageExtensions, ['bot']>;
    sender: {
        pushName?: string;
        id: string;
        lid?: string;
        pn?: string;
    } & ExtractInject<SerializedMessageExtensions, ['sender']>;
    permissions: {
        sender: {
            superAdmin: boolean;
            admin: boolean;
        } & ExtractInject<SerializedMessageExtensions, ['permissions', 'sender']>;
        bot: {
            superAdmin: boolean;
            admin: boolean;
        } & ExtractInject<SerializedMessageExtensions, ['permissions', 'bot']>;
    } & ExtractInject<SerializedMessageExtensions, ['permissions']>;
    body: {
        mtype: string;
        rawText: string;
        command: string;
        argsText: string;
        args: string[];
        mentionedJid: string[];
        expiration: number;
    } & ExtractInject<SerializedMessageExtensions, ['body']>;
    message: any;
    quoted?: {
        key: any;
        chat: string;
        fromMe: boolean;
        flags: {
            fromMe: boolean;
            isGroup: boolean;
            isText: boolean;
            isSticker: boolean;
            isImage: boolean;
            isVideo: boolean;
            isAudio: boolean;
            isDocument: boolean;
            isMedia: boolean;
        } & ExtractInject<SerializedMessageExtensions, ['quoted', 'flags']>;
        sender: {
            lid?: string;
            pn?: string;
        } & ExtractInject<SerializedMessageExtensions, ['quoted', 'sender']>;
        msg: {
            mtype: string;
            rawText: string;
            command: string;
            argsText: string;
            args: string[];
            mentionedJid: string[];
            expiration: number;
        } & ExtractInject<SerializedMessageExtensions, ['quoted', 'msg']>;
        message: WAMessageContent;
        downloadMedia: (WAMessage?: WAMessage) => Promise<Buffer>;
    } & ExtractInject<SerializedMessageExtensions, ['quoted']>;
    commands: any[];
    plugins: PluginDataExtensions & Record<string, any>;
    downloadMedia: (WAMessage?: WAMessage) => Promise<Buffer>;
}
export interface CommandContext {
    sock: WASocket;
    db: Knex;
    msg: SerializedMessage;
    plugin: {
        key: string;
    } & PluginManifest;
    t: (path: string, params?: Record<string, any>) => string;
    cache: CacheService;
    config: {
        get: (configPath: string) => any;
        set: (configPath: string, newData: any) => Promise<void>;
    };
    getPluginMsg: (path?: string) => any;
    setPluginMsg: (path: string, value: any, position?: number) => void;
}
export interface Command extends CommandExtensions {
    name: string;
    aliases?: string[];
    description?: string;
    execute: (ctx: CommandContext) => Promise<void> | void;
}
export interface MiddlewareContext<T extends keyof BaileysEventMap | 'command'> {
    sock: WASocket;
    payload: T extends keyof BaileysEventMap ? BaileysEventMap[T] : SerializedMessage;
    eventName: string;
    plugin: {
        key: string;
    } & PluginManifest;
    t: (path: string, params?: Record<string, any>) => string;
    cache: CacheService;
    getPluginMsg: (path?: string) => any;
    setPluginMsg: (path: string, val: any, pos?: number) => void;
    next: () => boolean;
    abort: (logMessage: string) => {
        _isAbort: true;
        log: string;
    };
}
export interface Middleware<T extends keyof BaileysEventMap | 'command' = keyof BaileysEventMap | 'command'> extends MiddlewareExtensions {
    event: T;
    description?: string;
    priority?: number;
    handler: (ctx: MiddlewareContext<T>) => Promise<boolean | any> | boolean | any;
}
export interface EventContext<T extends keyof BaileysEventMap> {
    sock: WASocket;
    eventData: BaileysEventMap[T];
    cache: CacheService;
    manifest: {
        key: string;
    } & PluginManifest;
}
export interface Event<T extends keyof BaileysEventMap = keyof BaileysEventMap> extends EventExtensions {
    event: T;
    priority?: number;
    description?: string;
    execute: (ctx: EventContext<T>) => Promise<void> | void;
}
export declare const defineCommand: (config: Command) => Command;
export declare const defineMiddleware: <T extends keyof BaileysEventMap | "command">(config: Middleware<T>) => Middleware<T>;
export declare const defineEvent: <T extends keyof BaileysEventMap>(config: Event<T>) => Event<T>;
export {};
