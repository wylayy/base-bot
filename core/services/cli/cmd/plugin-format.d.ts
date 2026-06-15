declare const _default: {
    name: string;
    description: string;
    flags: {
        name: string;
        alias: string;
        type: string;
        description: string;
    }[];
    action: (args: string[], flags: Record<string, any>, cli: any) => Promise<void>;
};
export default _default;
