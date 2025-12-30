import { z } from "zod";
import crypto from "crypto";
import argon2 from "argon2";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const isLocal = process.env.NODE_ENV !== "production";

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

export function slowHash(data: string){
    return argon2.hash(data, {
        timeCost: 2, 
        memoryCost: 2 ** 14,
        parallelism: 1,
    });
}

export function slowVerify(hashed: string, token: string){
    return argon2.verify(hashed, token);
}


export const s3Client = new S3Client({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "admin",
        secretAccessKey: process.env.S3_SECRET_KEY || "password"
    },
    forcePathStyle: true,
    endpoint: process.env.S3_ENDPOINT || "http://127.0.0.1:9000"
});

export const uploadFile = async (Key: string, fileBuffer: Buffer, mimetype: string) => {
    const command = new PutObjectCommand({
        Bucket: "my-app-bucket",
        Key,
        Body: fileBuffer,
        ContentType: mimetype,
    });

    return s3Client.send(command);
};

export const deleteFile = async (Key: string) => {
    const command = new DeleteObjectCommand({
        Bucket: "my-app-bucket",
        Key,
    });

    return s3Client.send(command);
};