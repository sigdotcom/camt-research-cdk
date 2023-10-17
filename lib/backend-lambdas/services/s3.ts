import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

class S3Service {
  private s3: S3Client;

  constructor() {
    this.s3 = new S3Client();
  }

  async getPresignedPutUrl(bucketName: string) {
    const date = new Date().toISOString().split("T")[0];
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: date,
    });

    // Generate pre-signed URL
    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 }); // 1-hour expiration
    return url;
  }
}

export default S3Service;
