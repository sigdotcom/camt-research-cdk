import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { generateErrorResponse, headers } from "./common/types";
import S3Service from "./services/s3";
import SSMService from "./services/Ssm";

export const getPresignedUrlHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const s3Service = new S3Service();
    const ssmService = new SSMService();

    const bucketName = await ssmService.getParameter("camtResearchBucket");
    if (!bucketName) {
      throw new Error("Bucket name not found in SSM");
    }
    const url = await s3Service.getPresignedPutUrl(bucketName);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(url),
    };
  } catch (err: unknown) {
    console.log(err);
    return generateErrorResponse(
      (err as Error).message || "Internal server error"
    );
  }
};
