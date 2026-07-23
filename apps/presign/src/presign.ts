import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "./s3.ts";

import type { APIGatewayProxyResultV2 } from "aws-lambda";

export async function getUploadUrl(
  key: string,
): Promise<APIGatewayProxyResultV2> {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_RAW_BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  };
}

export async function getPlayUrl(
  key: string,
): Promise<APIGatewayProxyResultV2> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_PROCESSED_BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  };
}
