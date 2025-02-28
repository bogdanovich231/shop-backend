import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import getProductsList from "../handlers/getProductsList";
import headers from "../handlers/utils/headers";
import products from "../handlers/utils/products";

describe("get products list function", () => {
  it("should return a successful response with a list of products", async () => {
    const event: APIGatewayProxyEvent = {} as any;
    const response: APIGatewayProxyResult = await getProductsList(event);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual(headers);
    expect(response.body).toEqual(JSON.stringify(products));
  });

  it("should return a valid JSON body", async () => {
    const event: APIGatewayProxyEvent = {} as any;
    const response: APIGatewayProxyResult = await getProductsList(event);

    expect(() => JSON.parse(response.body)).not.toThrow();
    expect(JSON.parse(response.body)).toEqual(products);
  });
});
