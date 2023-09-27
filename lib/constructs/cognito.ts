import { StackProps } from "aws-cdk-lib";
import {
  OAuthScope,
  StringAttribute,
  UserPool,
  UserPoolClient,
  UserPoolDomain,
  UserPoolOperation,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import SsmContruct from "./ssm";
import { Function as LambdaFunction } from "aws-cdk-lib/aws-lambda";

export interface CognitoConstructProps extends StackProps {
  environment: string;
}

export default class CognitoConstruct extends Construct {
  private readonly userPool: UserPool;
  private readonly userPoolClient: UserPoolClient;
  private readonly parameterArns: string[];
  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id);

    const authParameterStore = new SsmContruct(this, "AuthParameterStore", {});

    this.userPool = new UserPool(this, "CamtUserPool", {
      userPoolName: `Camt-${props.environment}-UserPool`,
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      signInAliases: { email: true },
      signInCaseSensitive: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      standardAttributes: {
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
        // You can configure other standard attributes similarly
      },
      customAttributes: {
        role: new StringAttribute({ mutable: true }),
      },
    });

    this.userPoolClient = this.userPool.addClient("CamtUserPoolClient");

    const ssmParameters = [
      { name: "userPoolId", value: this.userPool.userPoolId },
      {
        name: "userPoolWebClientId",
        value: this.userPoolClient.userPoolClientId,
      },
    ];

    ssmParameters.forEach((param) => {
      authParameterStore.createParameter(param.name, param.value);
    });

    this.parameterArns = authParameterStore.parameterArns;
  }

  public get authParameterArns(): string[] {
    return this.parameterArns;
  }

  public get getArn(): string {
    return this.userPool.userPoolArn;
  }
  public addPostTrigger(lambdaFunction: LambdaFunction) {
    this.userPool.addTrigger(
      UserPoolOperation.POST_CONFIRMATION,
      lambdaFunction
    );
  }
}
