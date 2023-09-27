import { StackProps } from "aws-cdk-lib";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface SsmConstructProps extends StackProps {}

export default class SsmConstruct extends Construct {
  private readonly ssmParameterArns: string[] = [];

  constructor(scope: Construct, id: string, props: SsmConstructProps) {
    super(scope, id);
  }

  public createParameter(name: string, value: string) {
    const ssmParameter = new StringParameter(this, `${name}Parameter`, {
      parameterName: name,
      stringValue: value,
      description: `AWS Cognito enviromental variable ${name} for frontend connection`,
    });

    this.ssmParameterArns.push(ssmParameter.parameterArn);
  }

  public get parameterArns(): string[] {
    return this.ssmParameterArns;
  }
}
