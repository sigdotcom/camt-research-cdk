import { Stack, StackProps } from "aws-cdk-lib";
import {
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

import LambdaEndpointConstruct, {
  LambdaEndpointConstructProps,
} from "./constructs/lambda-endpoint";
import { HttpMethods, Permission } from "./types";
import SsmContruct from "./constructs/ssm";
interface CamtBackendStackProps extends StackProps {
  userPool: UserPool;
}

export class CamtBackendStack extends Stack {
  constructor(scope: Construct, id: string, props: CamtBackendStackProps) {
    super(scope, id, props);

    const userPool = props.userPool;
    const backendParameterStore = new SsmContruct(
      this,
      "BackendParameterStore",
      {}
    );
    const environment: string = this.node.tryGetContext("environment") || "dev";
    console.log(environment);

    const endpoints: LambdaEndpointConstructProps[] = [
      {
        name: "listUsers",
        entry: "dist/lib/backend-lambdas/listUsers.js",
        method: HttpMethods.GET,
        path: "users/list",
        permissions: [Permission.DYNAMODB],
      },
      {
        name: "getUser",
        entry: "dist/lib/backend-lambdas/getUser.js",
        method: HttpMethods.GET,
        path: "users/get",
        permissions: [Permission.DYNAMODB],
      },
      {
        name: "updatePermission",
        entry: "dist/lib/backend-lambdas/updatePermission.js",
        method: HttpMethods.POST,
        path: "users/permissions",
        permissions: [
          Permission.DYNAMODB,
          Permission.COGNITO,
          Permission.IDENTITYSTORE,
        ],
      },
      {
        name: "requestAccount",
        entry: "dist/lib/backend-lambdas/requestAccount.js",
        method: HttpMethods.POST,
        path: "users/account/request",
        permissions: [Permission.DYNAMODB],
      },
      {
        name: "createAccount",
        entry: "dist/lib/backend-lambdas/createAccount.js",
        method: HttpMethods.POST,
        path: "users/account/create",
        permissions: [Permission.DYNAMODB, Permission.IDENTITYSTORE],
      },
      {
        name: "deleteAccount",
        entry: "dist/lib/backend-lambdas/deleteAccount.js",
        method: HttpMethods.POST,
        path: "users/account/delete",
        permissions: [Permission.DYNAMODB, Permission.IDENTITYSTORE],
      },
    ];

    const authorizer = new CognitoUserPoolsAuthorizer(
      this,
      `CamtApi-${environment}-Authorizer`,
      {
        cognitoUserPools: [userPool],
      }
    );

    const api = new RestApi(this, `Camt-${environment}-Api`, {
      restApiName: "CamtApi",
      description: "main camt API",
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowMethods: [
          "GET",
          "POST",
          "PUT",
          "DELETE",
          "OPTIONS",
          "HEAD",
          "PATCH",
        ],
        allowHeaders: [
          "Authorization",
          "Content-Type",
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token",
          "X-Amz-User-Agent",
        ],
        allowCredentials: true,
      },
    });

    endpoints.forEach((endpoint) => {
      const pathParts = endpoint.path.split("/");

      let currentResource = api.root;
      for (const part of pathParts) {
        // Check if resource already exists. If not, create a new one.
        const existingResource = currentResource.getResource(part);
        if (!existingResource) {
          currentResource = currentResource.addResource(part);
        } else {
          currentResource = existingResource;
        }
      }

      const lambdaEndpoint: LambdaEndpointConstruct =
        new LambdaEndpointConstruct(this, endpoint.name, endpoint);
      const myFunctionIntegration = new LambdaIntegration(
        lambdaEndpoint.function
      );

      currentResource.addMethod(endpoint.method, myFunctionIntegration, {
        authorizer: authorizer,
      });
    });

    const ssmParameters = [{ name: "apiUrlResearch", value: api.url }];

    ssmParameters.forEach((param) => {
      backendParameterStore.createParameter(param.name, param.value);
    });
  }
}
