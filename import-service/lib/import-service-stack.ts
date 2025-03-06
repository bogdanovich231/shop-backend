import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "ImportBucket", {
      bucketName: "import-service-bucket-rs1",
    });

    const lambdaRole = new iam.Role(this, "LambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    bucket.grantPut(lambdaRole);

    const importProductsFile = new lambda.Function(
      this,
      "ImportProductsFileFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "importProductsFile.importProductsFile",
        code: lambda.Code.fromAsset("dist/handlers"),
        role: lambdaRole,
        environment: {
          BUCKET_NAME: bucket.bucketName,
        },
      }
    );

    const api = new apigateway.RestApi(this, "ImportApi", {
      restApiName: "Import Service",
      description: "API for importing products",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const productsResource = api.root.addResource("import");
    productsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFile)
    );

    new cdk.CfnOutput(this, "ImportApiUrl", {
      value: api.url,
    });
  }
}
