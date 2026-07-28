import { Readable } from "node:stream";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { DeleteMessageCommand, ReceiveMessageCommand } from "@aws-sdk/client-sqs";

import { s3 } from "./s3.ts";
import { upload } from "./upload.ts";
import { QUEUE_URL, sqs } from "./sqs.ts";
import { transcode } from "./transcode.ts";

async function download(bucket: string, key: string, id: string) {
  const res = await s3.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key
  }))

  await pipeline(res.Body as Readable, createWriteStream(`/tmp/${id}`));
}

async function poll() {
  const { Messages } = await sqs.send(new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20
  }))

  if (!Messages) return;
  
  for (const message of Messages) {
    try {
      if (!message.Body) continue;
      const body = JSON.parse(message.Body);

      if (!body.Records) {
        console.error("Invalid message format:", message.Body);
        await sqs.send(new DeleteMessageCommand({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: message.ReceiptHandle
        }));
        continue;
      }
      
      for (const record of body.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replaceAll('+', " "));
        const id = key.replace(/\.[^.]+$/, "");

        console.log(`Processing file from S3: ${bucket}/${key}`);
        await download(bucket, key, id);
        console.log(`Downloaded file to /tmp/${id}`);
        await transcode(`/tmp/${id}`, `/tmp/${id}-hls`);
        console.log(`transcoded → /tmp/${id}-hls`);
        await upload(`/tmp/${id}-hls`, id);
        console.log(`published ${id}/ to processed`);
      }

      await sqs.send(new DeleteMessageCommand({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle
      }));
    } catch (err) {
      console.error("Failed to process message, leaving for retry:", err);
    }
  }
}

async function main() {
  while (true) {
    try {
      await poll();
    } catch (error) {
      console.error("Error polling SQS:", error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

await main();