import { Stack, StackProps } from "aws-cdk-lib";
import {
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import {
  Code,
  Function as LambdaFunction,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import LambdaEndpointConstruct, {
  LambdaEndpointConstructProps,
} from "./constructs/lambda-endpoint";
import { HttpMethods, Permission } from "./types";
import SsmContruct from "./constructs/ssm";
import S3Construct from "./constructs/s3";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { EventType } from "aws-cdk-lib/aws-s3";
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
        name: "getSensor",
        entry: "dist/lib/backend-lambdas/getSensor.js",
        method: HttpMethods.GET,
        path: "sensors/get",
        permissions: [Permission.DYNAMODB],
      },
      {
        name: "listSensors",
        entry: "dist/lib/backend-lambdas/listSensors.js",
        method: HttpMethods.GET,
        path: "sensors/list",
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
        name: "getPresignedUrl",
        entry: "dist/lib/backend-lambdas/getPresignedUrl.js",
        method: HttpMethods.GET,
        path: "upload/url",
        permissions: [Permission.S3, Permission.SSM],
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

    const researchBucket = new S3Construct(this, "ResearchBucketConstruct", {
      environment: environment,
      name: `camt-${environment}-research-bucket`,
    });

    const ssmParameters = [
      { name: "apiUrlResearch", value: api.url },
      { name: "camtResearchBucket", value: researchBucket.name },
    ];

    const dataProcessorLambdaRole = new Role(this, "LambdaRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    dataProcessorLambdaRole.addToPolicy(
      new PolicyStatement({
        actions: ["*"],
        resources: ["*"],
      })
    );

    // New permissions for CloudWatch Logs
    dataProcessorLambdaRole.addToPolicy(
      new PolicyStatement({
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:*"],
      })
    );

    const dataProcessorLambda = new LambdaFunction(
      this,
      "DataProcessorLambdaLambda",
      {
        runtime: Runtime.NODEJS_18_X,
        handler: "dataProcessor.dataProcessorHandler",
        code: Code.fromAsset("dist/lib/cdk-lambdas"),
        role: dataProcessorLambdaRole,
      }
    );

    researchBucket.addEvent(EventType.OBJECT_CREATED, dataProcessorLambda);

    ssmParameters.forEach((param) => {
      backendParameterStore.createParameter(param.name, param.value);
    });
  }
}
