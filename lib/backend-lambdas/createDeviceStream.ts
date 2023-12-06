import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import DynamoDBService from "./services/DynamoDb";
import { generateErrorResponse, headers } from "./common/types";
import S3Service from "./services/s3";
import SSMService from "./services/Ssm";

export const createDeviceStreamHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const dynamoService = new DynamoDBService("ResearchDeviceTable");
    const s3Service = new S3Service();
    const ssmService = new SSMService();
    const bucketName = await ssmService.getParameter("camtResearchBucket");
    if (!bucketName) {
      throw new Error("Bucket name not found in SSM");
    }

    const body = JSON.parse(event.body || "{}");

    const deviceId = body.deviceId;
    const streamId = body.streamId;

    if (!deviceId) {
      throw new Error("deviceId is required");
    }

    const streamUrl = await s3Service.getPresignedPutUrl(bucketName, streamId);

    await dynamoService.updateDeviceStreams(deviceId, {
      streamId: streamId,
      streamUrl: streamUrl,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({}),
    };
  } catch (err: unknown) {
    console.log(err);
    return generateErrorResponse(
      (err as Error).message || "Internal server error"
    );
  }
};
