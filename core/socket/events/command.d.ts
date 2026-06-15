import { BaileysEventMap } from 'baileys';
export default function ({ id, sock, event, }: {
    id: string;
    sock: any;
    event: BaileysEventMap['messages.upsert'];
}): Promise<void>;
