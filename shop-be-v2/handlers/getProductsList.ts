import products from "./utils/products";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";

async function getProductsList(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(products),
  };
}
export default getProductsList;
