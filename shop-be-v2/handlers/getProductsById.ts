const headers = require("./utils/headers");
const products = require("./utils/products");

async function getProductsById(event) {
  const productId = Number(event.pathParameters.productId);
  const product = products.find((p) => p.id === productId);

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

module.exports = { getProductsById };
