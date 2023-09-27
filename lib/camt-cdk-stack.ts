import { Stack, StackProps } from "aws-cdk-lib";
import {
  Code,
  Function as LambdaFunction,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { AmplifyConstruct, CognitoConstruct } from "./constructs";
import { Construct } from "constructs";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import DynamoDBConstruct from "./constructs/dynamodb";

export class CamtCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const environment: string = this.node.tryGetContext("environment") || "dev";
    console.log(environment);

    const Auth = new CognitoConstruct(this, "CamtAuth", {
      environment: environment,
    });
    const cognitoPostConfirmLambdaRole = new Role(this, "LambdaRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    cognitoPostConfirmLambdaRole.addToPolicy(
      new PolicyStatement({
        actions: ["cognito-idp:AdminUpdateUserAttributes"],
        resources: ["*"],
      })
    );

    // New permissions for CloudWatch Logs
    cognitoPostConfirmLambdaRole.addToPolicy(
      new PolicyStatement({
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:*"],
      })
    );

    cognitoPostConfirmLambdaRole.addToPolicy(
      new PolicyStatement({
        actions: ["dynamodb:PutItem", "dynamodb:UpdateItem"],
        resources: ["*"],
      })
    );

    const postConfirmationLambda = new LambdaFunction(
      this,
      "CognitoPostConfirmationLambda",
      {
        runtime: Runtime.NODEJS_18_X,
        handler: "handleCognitoPostConfirmation.handler",
        code: Code.fromAsset("dist/lib/lambda"),
        role: cognitoPostConfirmLambdaRole,
      }
    );

    Auth.addPostTrigger(postConfirmationLambda);

    const CamtFrontend = new AmplifyConstruct(this, "CamtFrontend", {
      environment: environment,
      gitOwner: "sigdotcom",
      gitRepo: "camt-research-frontend",
    });

    CamtFrontend.addPolicy(["ssm:GetParameter"], Auth.authParameterArns);

    const userTable = new DynamoDBConstruct(this, "UserTableConstruct", {
      environment: environment,
      tableName: "UserTable",
      partitionKey: "userId",
    });
  }
}
