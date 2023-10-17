import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda"; // Import the S3Event type

const dynamoDb = new DynamoDBClient({ region: "us-east-1" });
const s3 = new S3({ region: "us-east-1" });

const dataProcessorHandler = async (event: S3Event) => {
  // Log the event object for debugging
  console.log("S3 Event:", JSON.stringify(event, null, 2));

  //   Extract bucket name and key from the event
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );

  // Fetch the object from S3
  const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
  let rawData;
  try {
    const data = await s3.send(getObjectCommand);
    rawData = await streamToString(data.Body);
    console.log("Raw data:", rawData);
  } catch (err) {
    console.log("Error fetching object from S3:", err);
    return;
  }

  // TODO: Your logic to determine the file type (CSV, JSON, HDF5, etc.)
  // Based on the file type, you'll choose the appropriate way to parse rawData

  // TODO: Your logic to process the data
  // Assume the processed data is stored in a variable 'processedData'

  // TODO: If you're using an LLM like OpenAI API, this is where you'd make the call
  // to categorize or prioritize fields in 'processedData'.

  // Prepare the item for DynamoDB
  //   const item = {
  //     TableName: "YourTableName",
  //     Item: processedData, // Your processed data
  //   };

  // Store the data in DynamoDB
  //   const putItemCommand = new PutItemCommand(item);
  //   try {
  //     const data = await dynamoDb.send(putItemCommand);
  //     console.log("Item successfully inserted", data);
  //   } catch (err) {
  //     console.log("Error inserting item", err);
  //   }

  // TODO: Your logic to store unsorted or unuseful data into a secondary S3 bucket
};

const streamToString = (stream: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
};

export { dataProcessorHandler };
