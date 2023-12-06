import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import { createHash } from "crypto";
function simpleNumericRepresentation(hexString: string): number {
  return hexString.split("").reduce((sum, char) => sum + parseInt(char, 16), 0);
}
const dynamoDb = new DynamoDBClient({ region: "us-east-1" });
const s3 = new S3({ region: "us-east-1" });

const dataProcessorHandler = async (event: S3Event) => {
  console.log("S3 Event:", JSON.stringify(event, null, 2));

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

    let displayName = sensorId;

    if (Item) {
      const existingData = JSON.parse(Item.data?.S ?? "[]");

      let updatedData;
      if (Array.isArray(parsedData)) {
        updatedData = [...existingData, ...parsedData];
      } else {
        updatedData = [...existingData, parsedData];
      }

      const updateItemCommand = new UpdateItemCommand({
        TableName: "ResearchSensorTable",
        Key: {
          sensorId: { S: sensorId },
        },
        UpdateExpression: "set #data = :data",
        ExpressionAttributeNames: {
          "#data": "data",
        },
        ExpressionAttributeValues: {
          ":data": { S: JSON.stringify(updatedData) },
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
          displayName: { S: displayName },
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
  if (sampleItem.sensor_type) {
    return sampleItem.sensor_type;
  } else {
    const schemaString = Object.keys(sampleItem).join(":");
    hash.update(schemaString);
  }

  // Return a hex digest of the hash
  return hash.digest("hex");
};

export { dataProcessorHandler };
