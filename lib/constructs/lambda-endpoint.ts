import { StackProps } from "aws-cdk-lib";
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

import { Construct } from "constructs";
import { HttpMethods, Permission } from "../types";

export interface LambdaEndpointConstructProps extends StackProps {
  name: string;
  entry: string;
  method: HttpMethods;
  path: string;
  permissions: Permission[];
  authorizer?: any;
}
export default class LambdaEndpointConstruct extends Construct {
  private readonly lambdaFunction: NodejsFunction;
  constructor(
    scope: Construct,
    id: string,
    props: LambdaEndpointConstructProps
  ) {
    super(scope, id);

    const lambdaRole = new Role(this, `LambdaDynamoRole`, {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      description: `Endpoint role for ${props.name}`,
    });

    // New permissions for CloudWatch Logs
    lambdaRole.addToPolicy(
      new PolicyStatement({
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:*"],
      })
    );

    props.permissions.forEach((permission: Permission) => {
      if (permission === Permission.DYNAMODB) {
        const dynamoDBPolicyStatement = new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:Scan",
            "dynamodb:Query",
          ],
          resources: ["*"],
        });
        lambdaRole.addToPolicy(dynamoDBPolicyStatement);
      }
      if (permission === Permission.COGNITO) {
        const cognitoPolicyStatement = new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "cognito-idp:AdminUpdateUserAttributes",
            "cognito-idp:AdminUserGlobalSignOut",
          ],
          resources: ["*"],
        });
        lambdaRole.addToPolicy(cognitoPolicyStatement);
      }

      if (permission === Permission.IDENTITYSTORE) {
        const identityStorePolicyStatement = new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["*"],
          resources: ["*"],
        });
        lambdaRole.addToPolicy(identityStorePolicyStatement);
      }
      if (permission === Permission.S3) {
        const s3PolicyStatement = new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["s3:PutObject"],
          resources: ["*"],
        });
        lambdaRole.addToPolicy(s3PolicyStatement);
      }
      if (permission === Permission.SSM) {
        const ssmPolicyStatement = new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["ssm:GetParameter"],
          resources: ["*"],
        });
        lambdaRole.addToPolicy(ssmPolicyStatement);
      }
    });

    this.lambdaFunction = new NodejsFunction(this, `${props.name}`, {
      entry: props.entry,
      handler: `${props.name}Handler`,
      role: lambdaRole,
    });
  }
  public get function(): NodejsFunction {
    return this.lambdaFunction;
  }
}
