import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "ImportBucket", {
      bucketName: "import-service-bucket-rs1",
    });

    const productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTable",
      "products"
    );

    const lambdaRole = new iam.Role(this, "LambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    const queue = new sqs.Queue(this, "catalogItemsQueue", {
      queueName: "catalogItemsQueue",
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    const topic = new sns.Topic(this, "createProductTopic", {
      topicName: "createProductTopic",
    });

    const email = "kulinkovich56@gmail.com";
    const email2 = "testtatsiana6@gmail.com";

    topic.addSubscription(
      new subs.EmailSubscription(email2, {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            greaterThan: 100,
          }),
        },
      })
    );

    topic.addSubscription(
      new subs.EmailSubscription(email, {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            lessThanOrEqualTo: 100,
          }),
        },
      })
    );

    topic.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["sns:Publish"],
        resources: [topic.topicArn],
        principals: [new iam.AnyPrincipal()],
      })
    );

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:GetItem",
        ],
        resources: [
          productsTable.tableArn,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/products`,
        ],
      })
    );
    productsTable.grantReadWriteData(lambdaRole);

    bucket.grantPut(lambdaRole);

    bucket.grantReadWrite(lambdaRole);

    topic.grantPublish(lambdaRole);

    queue.grantSendMessages(lambdaRole);

    const catalogBatchProcess = new lambda.Function(
      this,
      "CatalogBatchProcess",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "catalogBatchProcess.catalogBatchProcess",
        code: lambda.Code.fromAsset("dist/handlers"),
        role: lambdaRole,
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          SNS_TOPIC_ARN: topic.topicArn,
        },
      }
    );

    topic.grantPublish(catalogBatchProcess);
    catalogBatchProcess.addEnvironment("SNS_TOPIC_ARN", topic.topicArn);
    queue.grantConsumeMessages(catalogBatchProcess);

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

    const importFileParser = new lambda.Function(
      this,
      "ImportFileParserFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "importFileParser.importFileParser",
        code: lambda.Code.fromAsset("dist/handlers"),
        role: lambdaRole,
        environment: {
          BUCKET_NAME: bucket.bucketName,
          SQS_QUEUE_URL: queue.queueUrl,
        },
      }
    );

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      { prefix: "uploaded/" }
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

    const eventSource = new SqsEventSource(queue, {
      batchSize: 5,
    });
    catalogBatchProcess.addEventSource(eventSource);

    new cdk.CfnOutput(this, "ImportApiUrl", {
      value: api.url,
    });
  }
}
