import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { generateErrorResponse, headers } from "./common/types";

export const uploadIotDataHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(event);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify("sup"),
    };
  } catch (err: unknown) {
    console.log(err);
    return generateErrorResponse(
      (err as Error).message || "Internal server error"
    );
  }
};
