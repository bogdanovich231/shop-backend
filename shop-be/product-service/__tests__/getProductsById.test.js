const { getProductsById } = require("../handlers/getProductsById");
const headers = require("../handlers/utils/headers");
const products = require("../handlers/utils/products");

describe("getProductsById", () => {
  it("should return a product when given a valid ID", async () => {
    const event = { pathParameters: { productId: "1" } };
    const response = await getProductsById(event);

    expect(response).toEqual({
      statusCode: 200,
      headers,
      body: JSON.stringify(products.find(p => p.id === "1")),
    });
  });

  it("should return 404 when no productId is provided", async () => {
    const event = { pathParameters: {} }; 
    const response = await getProductsById(event);

    expect(response).toEqual({
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "Product not found" }),
    });
  });
});