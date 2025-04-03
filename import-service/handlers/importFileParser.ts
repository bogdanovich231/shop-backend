import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import csvParser from "csv-parser";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const s3Client = new S3Client({ region: "eu-west-1" });
const sqsClient = new SQSClient({ region: "eu-west-1" });

export async function importFileParser(event: any): Promise<void> {
  try {
    const record = event.Records[0].s3;
    const bucketName = record.bucket.name;
    const objectKey = record.object.key;

    if (!objectKey.startsWith("uploaded/")) {
      console.log("File is not in the uploaded folder.");
      return;
    }

    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const response = await s3Client.send(getObjectCommand);
    const stream = response.Body as Readable;

    await new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on("data", async (data) => {
          try {
            const sendMessageCommand = new SendMessageCommand({
              QueueUrl: process.env.SQS_QUEUE_URL,
              MessageBody: JSON.stringify({
                id: data.id,
                title: data.title,
                price: data.price,
                description: data.description,
                image: data.image || "",
              }),
            });
            await sqsClient.send(sendMessageCommand);
            console.log("Record sent to SQS:", data);
          } catch (error) {
            console.error("Error sending record to SQS:", error);
          }
        })
        .on("end", async () => {
          console.log("CSV file processing completed.");
          const newObjectKey = objectKey.replace("uploaded/", "parsed/");
          const copyObjectCommand = new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${objectKey}`,
            Key: newObjectKey,
          });

          await s3Client.send(copyObjectCommand);
          console.log(`File copied to: ${newObjectKey}`);

          const deleteObjectCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
          });

          await s3Client.send(deleteObjectCommand);
          console.log(`File deleted from: ${objectKey}`);

          resolve(undefined);
        })
        .on("error", (error) => {
          console.error("Error parsing CSV:", error);
          reject(error);
        });
    });
  } catch (error) {
    console.error("Error processing S3 event:", error);
  }
}
