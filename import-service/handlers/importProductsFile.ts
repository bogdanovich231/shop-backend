import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "eu-west-1" });
export async function importProductsFile(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const fileName = event.queryStringParameters?.name;

    console.log("File name:", fileName);
    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "File name is required" }),
      };
    }
    const command = new PutObjectCommand({
      Bucket: "import-service-bucket-rs1",
      Key: `uploaded/${fileName}`,
      ContentType: "text/csv",
    });
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    console.log("Signed URL:", signedUrl);
    return {
      statusCode: 200,
      headers,
      body: signedUrl,
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
}
