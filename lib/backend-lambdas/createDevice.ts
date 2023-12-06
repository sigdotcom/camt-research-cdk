import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import DynamoDBService from "./services/DynamoDb";
import { generateErrorResponse, headers } from "./common/types";

export const createDeviceHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const dynamoService = new DynamoDBService("ResearchDeviceTable");

    const body = JSON.parse(event.body || "{}");

    const deviceId = body.deviceId;

    if (!deviceId) {
      throw new Error("deviceId is required");
    }
    await dynamoService.createDevice(deviceId);

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
