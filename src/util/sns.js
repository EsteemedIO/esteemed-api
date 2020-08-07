import { SNS } from 'aws-sdk'

const config = {
  apiVersion: '2012-08-10'
}

if (process.env.IS_OFFLINE) {
  config.region = 'localhost'
  config.endpoint = 'http://localhost:4002'
} else {
  config.region = process.env.AWS_DEFAULT_REGION
}

const sns = new SNS(config)

export default sns
