import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import DynamoDBService from "./services/DynamoDb";
import { generateErrorResponse, headers } from "./common/types";
import IdentityStoreService from "./services/IdentityStore";

export const deleteAccountHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    //change dynamodb state from "pending" -> "true"
    const dynamoService = new DynamoDBService("ResearchUserTable");
    const identityService = new IdentityStoreService();

    const body = JSON.parse(event.body || "{}");

    const userId = body.userId;
    const identityId = body.identityId;

    if (!userId) {
      throw new Error("userId is required");
    }
    const deleteUser = await identityService.deleteUser(identityId);
    const update = await dynamoService.updateAccountStatus(userId, "false");

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
