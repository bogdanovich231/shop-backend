import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const createProduct = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Request body is missing" }),
      };
    }

    const { title, description, price, count } = JSON.parse(event.body);

    if (!title || !description || !price || !count) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Invalid product data" }),
      };
    }

    const productId = Math.random().toString(36).substring(2, 15);

    const transactionCommand = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: process.env.PRODUCTS_TABLE!,
            Item: marshall({
              id: productId,
              title,
              description,
              price: Number(price),
            }),
          },
        },
        {
          Put: {
            TableName: process.env.STOCKS_TABLE!,
            Item: marshall({
              product_id: productId,
              count: Number(count),
            }),
          },
        },
      ],
    });

    await client.send(transactionCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ id: productId, title, description, price, count }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

export default createProduct;
