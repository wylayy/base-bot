import * as readline from 'node:readline';
interface CliCommand {
    name: string;
    description: string;
    flags?: Array<{
        name: string;
        alias?: string;
        type?: 'string' | 'boolean';
        description?: string;
    }>;
    action: (args: string[], flags: Record<string, any>, cli?: CliService) => Promise<void> | void;
}
declare class CliService {
    private commands;
    rl?: readline.Interface;
    private promptLabel;
    private isConsoleOverridden;
    isInteractive: boolean;
    private logBuffer;
    updatePromptLabel(text?: string): void;
    init(): Promise<void>;
    private printAbovePrompt;
    pause(): void;
    resume(): void;
    private flushLogs;
    private tokenize;
    private parseFlags;
    private overrideGlobalConsole;
    private handleLine;
    getCommands(): CliCommand[];
    private loadCommands;
}
declare const _default: CliService;
export default _default;
