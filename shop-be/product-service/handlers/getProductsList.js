const headers = require("./utils/headers");
const products = require("./utils/products");

async function getProductsList(event) {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(products),
  };
};

module.exports = { getProductsList };
