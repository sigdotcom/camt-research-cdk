import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import DynamoDBService from "./services/DynamoDb";
import { generateErrorResponse, headers } from "./common/types";

export const getSensorHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Extract sensorId from the query parameters
    const sensorId = event.queryStringParameters?.sensorId;

    if (!sensorId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "sensorId is required" }),
      };
    }

    const dynamoService = new DynamoDBService("ResearchSensorTable");

    const sensor = await dynamoService.getSensor(sensorId);

    if (!sensor) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Sensor not found" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(sensor),
    };
  } catch (err: unknown) {
    console.log(err);
    return generateErrorResponse(
      (err as Error).message || "Internal server error"
    );
  }
};
