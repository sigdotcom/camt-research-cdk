import { RemovalPolicy, StackProps } from "aws-cdk-lib";
import { Bucket, EventType, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { Function as LambdaFunction } from "aws-cdk-lib/aws-lambda";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";

export interface S3ConstructProps extends StackProps {
  environment: string;
  name: string;
}

export default class S3Construct extends Construct {
  private readonly bucket: Bucket;
  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    this.bucket = new Bucket(this, "S3Bucket", {
      bucketName: props.name,
      cors: [
        {
          allowedOrigins: ["http://localhost:3000", "https://camt.mstacm.org"],
          allowedMethods: [HttpMethods.PUT],
          allowedHeaders: ["*"],
        },
      ],
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }

  get name(): string {
    return this.bucket.bucketName;
  }

  addEvent(event: EventType, lambda: LambdaFunction) {
    this.bucket.addEventNotification(event, new LambdaDestination(lambda));
  }
}
