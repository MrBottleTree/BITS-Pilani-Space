import { z } from "zod";
import crypto from "crypto";
import argon2 from "argon2";
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import { NUM_ATTEMPTS_HANDLE_GENERATION } from "../../../config.js";
import { client } from "@repo/db";
const isLocal = process.env.NODE_ENV !== "production";

export function get_parsed_error_message(result: z.ZodSafeParseError<any>) {
    return result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
        code: issue.code
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

export const checkFileExists = async (key: string): Promise<boolean> => {
    const command = new HeadObjectCommand({
        Bucket: "my-app-bucket",
        Key: key,
    });

    try {
        await s3Client.send(command);
        return true;
    }
    catch (error: any) {
        if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        console.error("Error checking S3 file existence:", error);
        throw error;
    }
};

export const generateUniqueHandle = async (): Promise<String> => {
    // We have 426,710 unique names from this, 4*1e5 * 1e5, this will be if i follow it with a 5 digit number
    // so 4*1e(10) which is great, it is like 40,000,000,000 or 40Billion! good ig?
    const custom_config = {
        dictionaries: [adjectives, animals],
        separator: '',
        style: 'capital' as const // Something like BlackCow instead of like blackcow
    }

    let isUnique = false;
    let finalHandle = '';
    let attempts = 0;

    while(!isUnique && attempts < NUM_ATTEMPTS_HANDLE_GENERATION){
        attempts++;

        // Get a new base handle
        const base_handle = uniqueNamesGenerator(custom_config);

        const sequence = await client.handleSequence.upsert({
            where: { base_name: base_handle },
            update: { count: { increment: 1 } },
            create: { base_name: base_handle, count: 1 }
        });

        const potential_handle = sequence.count === 1? base_handle: `${base_handle}${sequence.count-1}`;

        const existing_user = await client.user.findUnique({
            where: { handle: potential_handle },
            select: { id: true }
        });

        if(!existing_user){
            finalHandle = potential_handle;
            isUnique = true;
        }
    }

    if(!isUnique){
        return "";
    }
    
    return finalHandle;
};