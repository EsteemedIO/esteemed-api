import db from '../util/dynamodb'

export default async user => {
  const date = new Date(user.updated * 1000)

  // Add join date.
  const params = {
    TableName: 'profiles',
    Key: {
      id: user.id
    },
    UpdateExpression: 'set join_date = :join_date',
    ExpressionAttributeValues: {
      ':join_date': date.toISOString().split('T')[0]
    }
  }

  await db.update(params).promise()
    .then(res => console.log(res))
    .catch(e => console.log(e))

  return {}
}
