const dynamodb = require("../util/dynamodb")

module.exports = async () => {
  try {
    var params = {
      TableName: 'jobs',
    }

    return await dynamodb.scan(params).promise()
      .then(({ Items }) => Items)
      .catch(e => console.log(e))
  } catch (e) {
    console.log(e)

    return { statusCode: 400, body: JSON.stringify(e) }
  }
}
