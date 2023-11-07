import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda"; // Import the S3Event type
import { createHash } from "crypto";
function simpleNumericRepresentation(hexString: string): number {
  return hexString.split("").reduce((sum, char) => sum + parseInt(char, 16), 0);
}
const dynamoDb = new DynamoDBClient({ region: "us-east-1" });
const s3 = new S3({ region: "us-east-1" });

const dataProcessorHandler = async (event: S3Event) => {
  // Log the event object for debugging
  console.log("S3 Event:", JSON.stringify(event, null, 2));

  // Extract bucket name and key from the event
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );

  const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
  let rawData;
  try {
    const data = await s3.send(getObjectCommand);
    rawData = await streamToString(data.Body);
    console.log("Raw data:", rawData);

    const parsedData = JSON.parse(rawData);
    console.log("Parsed data:", parsedData);

    // Create a sensor ID by hashing the concatenated keys
    const sensorId = createSensorId(parsedData);
    console.log("Sensor ID: ", sensorId);
    const numericSensorId: number = simpleNumericRepresentation(sensorId);
    // Check if the sensorID already exists in the SensorTable
    const input = {
      TableName: "ResearchSensorTable",
      Key: {
        sensorId: {
          S: sensorId,
        },
      },
    };

    const getItemCommand = new GetItemCommand(input);

    const { Item } = await dynamoDb.send(getItemCommand);

    if (Item) {
      console.log("Item exists:", Item);
      // Parse the existing data into an array
      const existingData = JSON.parse(Item.data?.S ?? "[]");
      console.log("existingData: ", existingData);
      // Append new data to the array
      let updatedData;
      if (Array.isArray(parsedData)) {
        updatedData = [...existingData, ...parsedData]; // This will concatenate the arrays properly
      } else {
        updatedData = [...existingData, parsedData]; // If parsedData is not an array, this will work as intended
      }
      console.log("updatedData: ", updatedData);
      // Update the entry with the new data array
      const updateItemCommand = new UpdateItemCommand({
        TableName: "ResearchSensorTable",
        Key: {
          sensorId: { S: sensorId },
        },
        UpdateExpression: "set #data = :data",
        ExpressionAttributeNames: {
          "#data": "data", // Assuming you have an attribute called 'data' to store your parsed data
        },
        ExpressionAttributeValues: {
          ":data": { S: JSON.stringify(updatedData) }, // Storing the updated array as a JSON string
        },
      });
      await dynamoDb.send(updateItemCommand);
      console.log("Item updated with new data.");
    } else {
      console.log("Item does not exist, creating new item...");
      const putItemCommand = new PutItemCommand({
        TableName: "ResearchSensorTable",
        Item: {
          sensorId: { S: sensorId },
          displayName: { S: `${numericSensorId.toString()}` },
          data: { S: JSON.stringify(parsedData) },
        },
      });
      await dynamoDb.send(putItemCommand);
      console.log("New item created.");
    }
  } catch (err) {
    console.log("Error fetching object from S3:", err);
    return;
  }
};

const streamToString = (stream: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
};

const createSensorId = (data: any[]): string => {
  // Use the first item to determine the schema
  const sampleItem = data[0];
  const hash = createHash("sha256");

  // Concatenate the keys as they are to form a string that represents the schema
  const schemaString = Object.keys(sampleItem).join(":");

  // Update the hash with the schema string
  hash.update(schemaString);

  // Return a hex digest of the hash
  return hash.digest("hex");
};

export { dataProcessorHandler };
