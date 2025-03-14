import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { catalogBatchProcess } from "../handlers/catalogBatchProcess";
import { SQSRecord } from "aws-lambda";

jest.mock("@aws-sdk/client-dynamodb");
jest.mock("@aws-sdk/client-sns");

const mockSend = jest.fn();

DynamoDBClient.prototype.send = mockSend;
SNSClient.prototype.send = mockSend;

describe("catalogBatchProcess", () => {
  beforeEach(() => {
    mockSend.mockClear();
    process.env.PRODUCTS_TABLE = "test-table";
    process.env.SNS_TOPIC_ARN = "arn:aws:sns:eu-west-1:123456789012:test-topic";
  });
  it("should process valid records and add them to DynamoDB and SNS", async () => {
    const validProduct = {
      id: "1",
      title: "Test Product",
      description: "Test Description",
      price: 100,
      image: "test-image-url",
    };

    const event = {
      Records: [
        {
          body: JSON.stringify(validProduct),
          messageId: "test-message-id",
          receiptHandle: "test-receipt-handle",
        } as SQSRecord,
      ],
    };
    await catalogBatchProcess(event);

    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend).toHaveBeenCalledWith(expect.any(PutItemCommand));
    expect(mockSend).toHaveBeenCalledWith(expect.any(PublishCommand));
  });
});
