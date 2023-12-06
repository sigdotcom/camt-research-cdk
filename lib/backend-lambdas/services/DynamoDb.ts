import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

class DynamoDBService {
  private dynamoDb: DynamoDBClient;
  private tableName: string;

  constructor(tableName: string) {
    this.dynamoDb = new DynamoDBClient();
    this.tableName = tableName;
  }
  async getUser(userId: string) {
    const input = {
      TableName: this.tableName,
      Key: {
        userId: {
          S: userId,
        },
      },
    };

    try {
      const command = new GetItemCommand(input);
      const response = await this.dynamoDb.send(command);
      return response.Item;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  async getSensor(sensorId: string) {
    const input = {
      TableName: this.tableName,
      Key: {
        sensorId: {
          S: sensorId,
        },
      },
    };

    try {
      const command = new GetItemCommand(input);
      const response = await this.dynamoDb.send(command);
      return response.Item;
    } catch (error) {
      console.error("Error fetching sensor:", error);
      throw error;
    }
  }

  async getDevice(deviceId: string) {
    const input = {
      TableName: this.tableName,
      Key: {
        deviceId: {
          S: deviceId,
        },
      },
    };

    try {
      const command = new GetItemCommand(input);
      const response = await this.dynamoDb.send(command);
      return response.Item;
    } catch (error) {
      console.error("Error fetching device:", error);
      throw error;
    }
  }

  async updateRole(id: string, role: string) {
    const input = {
      Key: {
        userId: {
          S: id,
        },
      },
      UpdateExpression: "SET #roleAttribute = :r",
      ExpressionAttributeNames: {
        "#roleAttribute": "role",
      },
      ExpressionAttributeValues: {
        ":r": {
          S: role,
        },
      },
      TableName: this.tableName,
    };

    try {
      const command = new UpdateItemCommand(input);
      const response = await this.dynamoDb.send(command);
      return response;
    } catch (error) {
      console.error("Error updating role:", error);
      throw error;
    }
  }

  async updateAccountStatus(id: string, status: string) {
    const input = {
      Key: {
        userId: {
          S: id,
        },
      },
      UpdateExpression: "SET #awsAccountStatusAttribute = :r",
      ExpressionAttributeNames: {
        "#awsAccountStatusAttribute": "awsAccountStatus",
      },
      ExpressionAttributeValues: {
        ":r": {
          S: status,
        },
      },
      TableName: this.tableName,
    };

    try {
      const command = new UpdateItemCommand(input);
      const response = await this.dynamoDb.send(command);
      return response;
    } catch (error) {
      console.error("Error updating role:", error);
      throw error;
    }
  }
  async updateDeviceStreams(
    deviceId: string,
    stream: { streamId: string; streamUrl: string }
  ) {
    const input = {
      Key: {
        deviceId: {
          S: deviceId,
        },
      },
      UpdateExpression:
        "SET streams = list_append(if_not_exists(streams, :empty_list), :new_stream)",
      ExpressionAttributeValues: {
        ":new_stream": {
          L: [
            {
              M: {
                streamId: { S: stream.streamId },
                streamUrl: { S: stream.streamUrl },
              },
            },
          ],
        },
        ":empty_list": {
          L: [],
        },
      },
      TableName: this.tableName,
    };

    try {
      const command = new UpdateItemCommand(input);
      const response = await this.dynamoDb.send(command);
      return response;
    } catch (error) {
      console.error("Error updating device:", error);
      throw error;
    }
  }
  async createDevice(deviceId: string) {
    const dynamoDbParams = {
      TableName: this.tableName,
      Item: {
        deviceId: { S: deviceId },
        streams: { L: [] }, // Initialize streams as an empty list
      },
    };

    try {
      const putCommand = new PutItemCommand(dynamoDbParams);
      const response = await this.dynamoDb.send(putCommand);
      return response;
    } catch (error) {
      console.error("Error creating device:", error);
      throw error;
    }
  }
  async scan() {
    const input = {
      TableName: this.tableName,
    };

    const command = new ScanCommand(input);
    const response = await this.dynamoDb.send(command);
    return response.Items;
  }
}

export default DynamoDBService;
