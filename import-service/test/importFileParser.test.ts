import { importFileParser } from "../handlers/importFileParser";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { mockClient } from "aws-sdk-client-mock";
import { SdkStreamMixin } from "@aws-sdk/types";

const s3Mock = mockClient(S3Client);

describe("importFileParser", () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it("should process CSV file and move file to parsed folder", async () => {
    const mockEvent = {
      Records: [
        {
          s3: {
            bucket: { name: "test-bucket" },
            object: { key: "uploaded/test.csv" },
          },
        },
      ],
    };

    const mockCSVData = "name,age\nTanya,10\nHel,20";

    const mockResponseStream = Readable.from([
      mockCSVData,
    ]) as unknown as SdkStreamMixin;
    s3Mock
      .on(GetObjectCommand)
      .resolves({ Body: mockResponseStream as SdkStreamMixin & Readable });

    s3Mock.on(CopyObjectCommand).resolves({});
    s3Mock.on(DeleteObjectCommand).resolves({});

    await importFileParser(mockEvent);

    expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(CopyObjectCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
  });

  it("should not process files outside uploaded folder", async () => {
    const mockEvent = {
      Records: [
        {
          s3: {
            bucket: { name: "test-bucket" },
            object: { key: "other-folder/test.csv" },
          },
        },
      ],
    };

    await importFileParser(mockEvent);

    expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(0);
    expect(s3Mock.commandCalls(CopyObjectCommand)).toHaveLength(0);
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(0);
  });
});
