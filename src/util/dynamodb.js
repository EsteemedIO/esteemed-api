import { DynamoDB } from 'aws-sdk'

const config = {
  apiVersion: '2012-08-10'
}

if (process.env.IS_OFFLINE) {
  config.region = 'localhost'
  config.endpoint = 'http://localhost:8000'
} else {
  config.region = process.env.AWS_DEFAULT_REGION
}

var dynamodb = new DynamoDB.DocumentClient(config)

export default dynamodb
