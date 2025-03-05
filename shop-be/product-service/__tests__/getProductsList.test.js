const { getProductsList } = require("../handlers/getProductsList");
const headers = require("../handlers/utils/headers");
const products = require("../handlers/utils/products");

describe("get products list function", () => {
  it("should return a successful response with a list of products", async () => {
    const event = {}; 
    const response = await getProductsList(event);

    expect(response).toEqual({
      statusCode: 200,
      headers,
      body: JSON.stringify(products),
    });
  });

  it("should return a valid JSON body", async () => {
    const event = {};
    const response = await getProductsList(event);

    expect(() => JSON.parse(response.body)).not.toThrow();
    expect(JSON.parse(response.body)).toEqual(products);
  });
});
