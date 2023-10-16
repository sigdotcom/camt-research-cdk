import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import DynamoDBService from "./services/DynamoDb";
import IdentityStoreService from "./services/IdentityStore";
import { generateErrorResponse, headers } from "./common/types";
import {
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoIdp = new CognitoIdentityProviderClient({ region: "us-east-1" });

export const updatePermissionHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const dynamoService = new DynamoDBService("ResearchUserTable");
    const identityService = new IdentityStoreService();
    const body = JSON.parse(event.body || "{}");

    const userId = body.userId;
    const role = body.userRole;
    const userPoolId = body.userPoolId;
    const identityId = body.identityId;

    if (!userId || !role) {
      throw new Error("userId and role are required");
    }

    const cognitoParams = {
      UserAttributes: [
        {
          Name: "custom:role",
          Value: role,
        },
      ],
      Username: userId,
      UserPoolId: userPoolId,
    };

    //assign SSO permissions to user

    if (identityId !== "false" && identityId !== "pending") {
      await identityService.assignGroup(identityId, role);
    }

    const command = new AdminUpdateUserAttributesCommand(cognitoParams);
    await cognitoIdp.send(command);

    const update = await dynamoService.updateRole(userId, role);

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
