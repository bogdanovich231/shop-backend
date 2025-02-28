import headers from "./utils/headers";
import products from "./utils/products";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

async function getProductsById(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const productId = Number(event.pathParameters?.productId);
  const product = products.find((p) => Number(p.id) === productId);

  if (!product) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "Product not found" }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(product),
  };
}

export default getProductsById;
