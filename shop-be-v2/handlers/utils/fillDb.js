const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const products = require('../../dist/handlers/utils/products').default;

const client = new DynamoDBClient({ region: 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(client);

const productsTable = 'products';
const stocksTable = 'stocks';

const stocks = [
  {
    product_id: '1', 
    count: 10, 
  },
  {
    product_id: '3',
    count: 5,
  },
];

const fillDb = async () => {
  try {
    const putProductsRequests = products.map(product => ({
      PutRequest: {
        Item: {
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          image: product.image,
        },
      },
    }));

    const putStockRequests = stocks.map(stock => ({
      PutRequest: {
        Item: {
          product_id: stock.product_id,
          count: stock.count,
        },
      },
    }));

    const requestItems = {};

    if (putProductsRequests.length > 0) {
      requestItems[productsTable] = putProductsRequests;
    }

    if (putStockRequests.length > 0) {
      requestItems[stocksTable] = putStockRequests;
    }

    const command = new BatchWriteCommand({
      RequestItems: requestItems,
    });

    const response = await docClient.send(command);
    console.log('DynamoDB response:', response);
    console.log('Products and stocks was uploading');
  } catch (error) {
    console.error('Error uploading products and stocks:', error);
  }
};

fillDb();
