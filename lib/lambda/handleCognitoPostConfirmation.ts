import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const cognitoIdp = new CognitoIdentityProviderClient({ region: "us-east-1" });
const dynamoDb = new DynamoDBClient({ region: "us-east-1" });

const handler = async (event: any) => {
  const params = {
    UserAttributes: [
      {
        Name: "custom:role",
        Value: "member",
      },
    ],
    UserPoolId: event.userPoolId,
    Username: event.userName,
  };

  try {
    // Make the call to update user attributes
    const command = new AdminUpdateUserAttributesCommand(params);
    await cognitoIdp.send(command);

    // Insert the new user entry into the "UserTable"
    const dynamoDbParams = {
      TableName: "UserTable",
      Item: {
        userId: { S: event.userName },
        firstName: { S: event.request.userAttributes.given_name },
        lastName: { S: event.request.userAttributes.family_name },
        role: { S: "member" },
      },
    };
    const putCommand = new PutItemCommand(dynamoDbParams);
    await dynamoDb.send(putCommand);
  } catch (err) {
    console.error("Error updating user attributes:", err);
    throw err;
  }

  return event;
};

export { handler };
