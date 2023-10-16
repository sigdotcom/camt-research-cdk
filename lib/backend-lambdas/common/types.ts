import { APIGatewayProxyResult } from "aws-lambda";

export const headers = {
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE,PATCH",
};

export const generateErrorResponse = (
  message: string
): APIGatewayProxyResult => ({
  statusCode: 500,
  headers,
  body: JSON.stringify({ message }),
});
