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

export const HTTP_BACKEND_URL = 'http://localhost:3000';
export const WS_BACKEND_URL = 'ws://localhost:3001';
export const S3_BUCKET_URL = 'http://localhost:9000/my-app-bucket';

export function getImageUrl(imageKey: string): string {
    return `${S3_BUCKET_URL}/${imageKey}`;
}