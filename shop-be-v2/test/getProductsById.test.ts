import getProductsById from "../handlers/getProductsById";
import headers from "../handlers/utils/headers";
import products from "../handlers/utils/products";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

describe("getProductsById", () => {
  it("should return a product when given a valid ID", async () => {
    const event: APIGatewayProxyEvent = {
      pathParameters: { productId: "1" },
    } as any;

    const response: APIGatewayProxyResult = await getProductsById(event);

    expect(response).toEqual({
      statusCode: 200,
      headers,
      body: JSON.stringify(products.find((p) => p.id === "1")),
    });
  });

  it("should return 404 when no productId is provided", async () => {
    const event: APIGatewayProxyEvent = {
      pathParameters: {},
    } as any;

    const response: APIGatewayProxyResult = await getProductsById(event);

    expect(response).toEqual({
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "Product not found" }),
    });
  });
});
