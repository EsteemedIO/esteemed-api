const dynamodb = require('../util/dynamodb')

module.exports = async user => {
  const date = new Date(user.updated * 10000)

  // Add join date.
  let params = {
    TableName: "profiles",
    Key: {
      id: user.id
    },
    UpdateExpression: `set join_date = :join_date`,
    ExpressionAttributeValues: {
      ':join_date': date.toISOString()
    }
  }

  await dynamodb.update(params).promise()
    .then(res => console.log(res))
    .catch(e => console.log(e))

  return {}
}
