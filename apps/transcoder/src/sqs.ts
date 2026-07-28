import { SQSClient } from "@aws-sdk/client-sqs";

export const sqs = new SQSClient({
  endpoint: process.env.SQS_ENDPOINT,
  region: process.env.S3_REGION
})

export const QUEUE_URL = process.env.SQS_QUEUE_URL; 

