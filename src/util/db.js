import db from '../util/dynamodb'

// Job Calls
const jobs = {
  get: async (item) => {
    const params = {
      TableName: 'jobs'
    }
    if (item !== null) {
      params.Key = { id: item }
      return await db.get(params).promise()
        .then(({ Item }) => Item)
        .catch(e => console.log(e))
    } else {
      return await db.scan(params).promise()
        .then(({ Items }) => Items)
        .catch(e => console.log(e))
    }
  },

  post: async (item) => {
    const params = {
      TableName: 'jobs',
      Item: item
    }
    return await db.put(params).promise()
  },

  update: async (jobId, job) => {
    const params = formatDBQuery(job)
    params.TableName = 'jobs'
    params.Key = { id: jobId }

    if (job.active !== undefined) {
      params.UpdateExpression = params.UpdateExpression + ', active = :active'
      params.ExpressionAttributeValues[':active'] = job.active
    }

    return db.update(params).promise()
  }
}

// Profile Calls
const profiles = {
  get: async (userId) => {
    const params = {
      TableName: 'profiles',
      Key: {
        id: userId
      }
    }
    return (await db.get(params).promise().then(({ Item }) => Item) || {})
  },

  getAll: async () => {
    const params = {
      TableName: 'profiles'
    }
    return await db.scan(params).promise().then(({ Items }) => Items)
  },

  update: async (userId, user) => {
    const params = formatDBQuery(user)
    params.TableName = 'profiles'
    params.Key = { id: userId }

    return await db.update(params).promise()
  }
}

function formatDBQuery(query) {
  const dynamoReservedWords = [
    'duration',
    'timezone'
  ]

  const updateExpression = Object.keys(query)
    .map(field => {
      // Account for reserved keywords in DynamoDB.
      const hash = dynamoReservedWords.includes(field) ? '#' : ''
      return `${hash}${field} = :${field}`
    })
    .join(', ')

  const objKeys = Object.keys(query)

  const expressionAttributeValues = objKeys
    .reduce((acc, cur) => {
      acc[`:${cur}`] = query[cur]
      return acc
    }, {})

  const expressionAttributeNames = objKeys
    .filter(field => dynamoReservedWords.includes(field))
    .reduce((acc, cur) => {
      acc[`#${cur}`] = cur
      return acc
    }, {})

  const params = {
    UpdateExpression: `set ${updateExpression}`,
    ExpressionAttributeValues: expressionAttributeValues
  }

  if (Object.keys(expressionAttributeNames).length) { params.ExpressionAttributeNames = expressionAttributeNames }

  return params
}

export {
  jobs,
  profiles
}
