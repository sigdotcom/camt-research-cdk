import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import DynamoDBService from "./services/DynamoDb";
import { generateErrorResponse, headers } from "./common/types";

export const listSensorsHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const dynamoService = new DynamoDBService("ResearchSensorTable");
    const sensors = await dynamoService.scan();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(sensors),
    };
  } catch (err: unknown) {
    console.log(err);
    return generateErrorResponse(
      (err as Error).message || "Internal server error"
    );
  }
};
