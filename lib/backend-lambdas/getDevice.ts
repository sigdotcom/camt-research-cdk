import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import DynamoDBService from "./services/DynamoDb";
import { generateErrorResponse, headers } from "./common/types";

export const getDeviceHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Extract deviceId from the query parameters
    const deviceId = event.queryStringParameters?.deviceId;

    if (!deviceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "deviceId is required" }),
      };
    }

    const dynamoService = new DynamoDBService("ResearchDeviceTable");

    const device = await dynamoService.getDevice(deviceId);

    if (!device) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Device not found" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(device),
    };
  } catch (err: unknown) {
    console.log(err);
    return generateErrorResponse(
      (err as Error).message || "Internal server error"
    );
  }
};
