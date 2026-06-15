declare const _default: {
    name: string;
    description: string;
    flags: ({
        name: string;
        type: string;
        description: string;
        alias?: undefined;
    } | {
        name: string;
        alias: string;
        type: string;
        description: string;
    })[];
    action: (_args: string[], flags: Record<string, any>, cli: any) => Promise<void>;
};
export default _default;
