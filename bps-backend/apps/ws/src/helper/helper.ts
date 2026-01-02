import { z } from "zod";

export function get_parsed_error_message(result: z.ZodSafeParseError<any>) {
    return result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
        code: issue.code
    }));
}