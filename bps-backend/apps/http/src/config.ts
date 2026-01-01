export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
};

export const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret_key";
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "jwt_refresh_secret_key";

declare global {
    namespace Express {
        interface Request {
            user?: {
                user_id: string,
                email: string,
                role: string
            }
        }
    }
}

export const REQUEST_HANDLED = false;
export const REQUEST_NOTHANDLED = true;