import { z } from 'zod';
export declare const BAILEYS_EVENT_NAMES: string[];
export declare const CommandSchema: z.ZodObject<{
    name: z.ZodString;
    aliases: z.ZodArray<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    withoutPrefix: z.ZodDefault<z.ZodBoolean>;
    execute: z.ZodCustom<Function, Function>;
}, z.core.$strip>;
export declare const MiddlewareSchema: z.ZodObject<{
    event: z.ZodEnum<{
        [x: string]: string;
    }>;
    priority: z.ZodDefault<z.ZodNumber>;
    handler: z.ZodCustom<Function, Function>;
}, z.core.$strip>;
export declare const EventSchema: z.ZodObject<{
    event: z.ZodEnum<{
        [x: string]: string;
    }>;
    priority: z.ZodDefault<z.ZodNumber>;
    execute: z.ZodCustom<Function, Function>;
}, z.core.$strip>;
