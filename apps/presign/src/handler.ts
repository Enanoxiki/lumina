import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getPlayUrl, getUploadUrl } from "./presign.ts";

exports.handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  const path = event.rawPath;
  const key = event.queryStringParameters?.key;

  if (!key) { return { statusCode: 400, headers: { "content-type": "application/json" }, body: JSON.stringify({ message: "Bad Request" }) } }

  if (path.endsWith("/upload")) return getUploadUrl(key);
  if (path.endsWith("/play")) return getPlayUrl(key);

  return {
    statusCode: 404,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: `Unknown path: ${path}` })
  }
}