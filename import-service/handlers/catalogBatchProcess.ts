import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSRecord } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const dynamoDbClient = new DynamoDBClient({ region: "eu-west-1" });
const snsClient = new SNSClient({ region: "eu-west-1" });

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
          id: { S: product.id },
          title: { S: product.title },
          description: { S: product.description },
          price: { N: product.price.toString() },
          image: { S: product.image || "" },
        },
      };
      const command = new PutItemCommand(params);
      await dynamoDbClient.send(command);

      const snsParams = {
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: JSON.stringify(product),
        Subject: "New product added",
        MessageAttributes: {
          price: {
            DataType: "Number",
            StringValue: product.price.toString(),
          },
        },
      };

      console.log("Sending message to SNS:", snsParams);
      await snsClient.send(new PublishCommand(snsParams));
      console.log("Message sent to SNS successfully");

      console.log(`Product added: ${product.id}`);
    } catch (error) {
      console.error(`Error processing record: ${record.body}`, error);
    }
  }
}
