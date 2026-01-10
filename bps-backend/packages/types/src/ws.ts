import { z } from "zod";

export const InitHandlerSchema = z.object({type: z.string(), payload: z.unknown()}).strict();

export const JoinSchema = z.object({space_id: z.string()});

export const MoveSchema = z.object({x: z.number().int(), y: z.number().int()});

export type OutgoingMessage = any;