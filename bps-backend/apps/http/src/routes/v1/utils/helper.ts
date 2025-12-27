import { z } from "zod";
import crypto from "crypto";

export function get_parsed_error_message(result: z.ZodSafeParseError<any>) {
    return result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message
    }));
}

export function fastHashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export function fastValidate(incomingToken: string, storedHash: string): boolean{
    const incoming_hash = fastHashToken(incomingToken);
    return crypto.timingSafeEqual(Buffer.from(incoming_hash), Buffer.from(storedHash));
}