import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import csvParser from "csv-parser";

const s3Client = new S3Client({ region: "eu-west-1" });

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
        .on("data", (data) => {
          console.log("Parsed record:", data);
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
