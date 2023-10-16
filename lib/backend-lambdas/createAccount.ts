import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import DynamoDBService from "./services/DynamoDb";
import { generateErrorResponse, headers } from "./common/types";
import IdentityStoreService from "./services/IdentityStore";

export const createAccountHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    //change dynamodb state from "pending" -> identityId
    const dynamoService = new DynamoDBService("ResearchUserTable");
    const identityService = new IdentityStoreService();

    const body = JSON.parse(event.body || "{}");

    const userId = body.userId;
    const role = body.role;
    const firstName = body.firstName;
    const lastName = body.lastName;
    const email = body.email;

    if (!userId) {
      throw new Error("userId is required");
    }
    const create = await identityService.createUser(firstName, lastName, email);
    if (create.UserId) {
      await identityService.assignGroup(create.UserId, role);
      await dynamoService.updateAccountStatus(userId, create.UserId);
    } else {
      await dynamoService.updateAccountStatus(userId, "false");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(create),
    };
  } catch (err: unknown) {
    console.log(err);
    return generateErrorResponse(
      (err as Error).message || "Internal server error"
    );
  }
};
