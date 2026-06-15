import { BaileysEventMap } from 'baileys';
export default function ({ sessionId, sock, events, }: {
    sessionId: string;
    sock: any;
    events: Partial<BaileysEventMap>;
}): Promise<void>;
