import { readdir, readFile } from "node:fs/promises";

import { PutObjectCommand } from "@aws-sdk/client-s3";

import { s3 } from "./s3.ts";

const CONTENT_TYPES: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
};

export async function upload(outDir: string, id: string) {
  const files = await readdir(outDir);
  for (const file of files) {
    const ext = file.slice(file.lastIndexOf("."));
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_PROCESSED_BUCKET,
      Key: `${id}/${file}`,
      Body: await readFile(`${outDir}/${file}`),
      ContentType: CONTENT_TYPES[ext],
    }));
  }
}