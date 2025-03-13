import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSRecord } from "aws-lambda";

const client = new DynamoDBClient({ region: "eu-west-1" });

export async function catalogBatchProcess(event: {
  Records: SQSRecord[];
}): Promise<void> {
  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      const product = body;

      if (
        !product.id ||
        !product.title ||
        !product.price ||
        !product.description
      ) {
        console.error("Invalid product data:", product);
        continue;
      }

      const params = {
        TableName: process.env.PRODUCTS_TABLE!,
        Item: {
          productId: { S: product.id },
          title: { S: product.title },
          description: { S: product.description },
          price: { N: product.price.toString() },
          image: { S: product.image || "" },
        },
      };
      const command = new PutItemCommand(params);
      await client.send(command);

      console.log(`Product added: ${product.id}`);
    } catch (error) {
      console.error(`Error processing record: ${record.body}`, error);
    }
  }
}
