import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import DynamoDBService from "./services/DynamoDb";
import { generateErrorResponse, headers } from "./common/types";

export const requestAccountHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    //change dynamodb state from "false" -> "pending"
    const dynamoService = new DynamoDBService("ResearchUserTable");
    const body = JSON.parse(event.body || "{}");

    const userId = body.userId;

    if (!userId) {
      throw new Error("userId is required");
    }
    const update = await dynamoService.updateAccountStatus(userId, "pending");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(update),
    };
  } catch (err: unknown) {
    console.log(err);
    return generateErrorResponse(
      (err as Error).message || "Internal server error"
    );
  }
};
