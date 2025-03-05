import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const getProductsById = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Product ID is required" }),
      };
    }

    const productCommand = new GetItemCommand({
      TableName: process.env.PRODUCTS_TABLE!,
      Key: {
        id: { S: productId },
      },
    });
    const productResult = await client.send(productCommand);

    if (!productResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Product not found" }),
      };
    }

    const stockCommand = new GetItemCommand({
      TableName: process.env.STOCKS_TABLE!,
      Key: {
        product_id: { S: productId },
      },
    });
    const stockResult = await client.send(stockCommand);

    const product = unmarshall(productResult.Item);
    const stock = stockResult.Item ? unmarshall(stockResult.Item) : null;

    const productWithStock = {
      ...product,
      count: stock?.count || 0,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(productWithStock),
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

export default getProductsById;
