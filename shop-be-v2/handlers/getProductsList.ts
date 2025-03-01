import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const getProductsList = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const productsCommand = new ScanCommand({
      TableName: process.env.PRODUCTS_TABLE!,
    });
    const productsResult = await client.send(productsCommand);

    const stocksCommand = new ScanCommand({
      TableName: process.env.STOCKS_TABLE!,
    });
    const stocksResult = await client.send(stocksCommand);

    const products = productsResult.Items?.map((item) => unmarshall(item));
    const stocks = stocksResult.Items?.map((item) => unmarshall(item));

    const productsWithStock = products?.map((product) => {
      const stock = stocks?.find((stock) => stock.product_id === product.id);
      return {
        ...product,
        count: stock?.count || 0,
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(productsWithStock),
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

export default getProductsList;
