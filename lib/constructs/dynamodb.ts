import { RemovalPolicy, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface DynamoDBConstructProps extends StackProps {
  environment: string;
  tableName: string;
  partitionKey: string;
  sortKey?: string;
}

export default class DynamoDBConstruct extends Construct {
  private readonly table: Table;

  constructor(scope: Construct, id: string, props: DynamoDBConstructProps) {
    super(scope, id);
    const tableProps: any = {
      tableName: props.tableName,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: props.partitionKey,
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.RETAIN,
    };

    // Only add sort key if it is provided
    if (props.sortKey) {
      tableProps.sortKey = {
        name: props.sortKey,
        type: AttributeType.STRING, // or AttributeType.NUMBER if using UNIX timestamps
      };
    }

    this.table = new Table(this, "DynamoDBTable", tableProps);
  }
}
