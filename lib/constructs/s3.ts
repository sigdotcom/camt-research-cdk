import { RemovalPolicy, StackProps } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

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
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
