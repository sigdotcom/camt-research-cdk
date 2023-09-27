import { RemovalPolicy, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface DynamoDBConstructProps extends StackProps {
  environment: string;
  tableName: string;
  partitionKey: string;
}

export default class DynamoDBConstruct extends Construct {
  private readonly table: Table;

  constructor(scope: Construct, id: string, props: DynamoDBConstructProps) {
    super(scope, id);
    this.table = new Table(this, "DynamoDBTable", {
      tableName: props.tableName,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: props.partitionKey,
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.RETAIN, // Use with caution: this deletes the table when the stack is deleted
    });
  }
}
