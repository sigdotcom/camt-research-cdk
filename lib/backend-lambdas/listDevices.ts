import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import DynamoDBService from "./services/DynamoDb";
import { generateErrorResponse, headers } from "./common/types";

export const listDevicesHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const dynamoService = new DynamoDBService("ResearchDeviceTable");
    const devices = await dynamoService.scan();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(devices),
    };
  } catch (err: unknown) {
    console.log(err);
    return generateErrorResponse(
      (err as Error).message || "Internal server error"
    );
  }
};
