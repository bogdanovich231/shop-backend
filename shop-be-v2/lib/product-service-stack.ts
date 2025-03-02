import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class ProductServiceCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTable",
      "products"
    );

    const stocksTable = dynamodb.Table.fromTableName(
      this,
      "StocksTable",
      "stocks"
    );

    const lambdaRole = new iam.Role(this, "LambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    productsTable.grantReadData(lambdaRole);
    stocksTable.grantReadData(lambdaRole);

    const getProductsList = new lambda.Function(
      this,
      "GetProductsListFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "getProductsList.getProductsList",
        code: lambda.Code.fromAsset("dist/handlers"),
        role: lambdaRole,
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          STOCKS_TABLE: stocksTable.tableName,
        },
      }
    );

    const getProductsById = new lambda.Function(
      this,
      "GetProductsByIdFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "getProductsById.getProductsById",
        code: lambda.Code.fromAsset("dist/handlers"),
        role: lambdaRole,
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          STOCKS_TABLE: stocksTable.tableName,
        },
      }
    );
    
    const createProductFunction = new lambda.Function(
      this,
      "CreateProductFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "createProduct.createProduct",
        code: lambda.Code.fromAsset("dist/handlers"),
        role: lambdaRole,
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          STOCKS_TABLE: stocksTable.tableName,
        },
      }
    );

    const api = new apigateway.RestApi(this, "ProductApi", {
      restApiName: "Product Service",
      description: "API for Product Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    });

    const productsResource = api.root.addResource("products");
    productsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsList)
    );
    productsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProductFunction)
    );
    const productByIdResource = productsResource.addResource("{productId}");
    productByIdResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsById)
    );

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url!,
    });
  }
}
