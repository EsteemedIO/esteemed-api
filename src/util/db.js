import { stringify } from 'qs'

import db from './dynamodb'
import { fetch as bhFetch } from './bullhorn'

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
  get: async slackId => {
    const params = {
      fields: Object.keys(profileFields).join(','),
      query: `${slackIdField}:${slackId}`
    }

    // Fetch the BH data, then re-assign values to proper keys.
    return bhFetch('search/Candidate?' + stringify(params))
      .then(res => reassignBHValues(res.data.data[0]))
      .then(res => ({ ...res, ...{
          skills: reduceSkills(res.skills),
          date_available: profile.date_available ? new Date(profile.date_available).toISOString().split('T')[0] : null,
        }}))
      .catch(e => console.log(e))
  },

  getAll: async () => {
    let allRecords = []
    const params = {
      fields: Object.keys(profileFields).join(','),
      query: 'isDeleted:FALSE',
      count: 200,
    }

    // Iterate queries to account for 500 record limit (200 record limit when
    // querying skills).
    async function doQuery(start) {
      if (start) params.start = start

      return await bhFetch('search/Candidate?' + stringify(params))
        .then(res => {
          allRecords = allRecords.concat(res.data.data)
          return (res.data.data.length >= params.count) ? doQuery(allRecords.length) : allRecords
        })
        .catch(e => console.log(e))
    }

    return doQuery()
      .then(res => res.map(item => reassignBHValues(item)))
      .then(profiles => profiles.map(profile => ({ ...profile, ...{
          skills: reduceSkills(profile.skills),
          date_available: profile.date_available ? new Date(profile.date_available).toISOString().split('T')[0] : null,
        }})))
  },
  getBHId: async slackId => {
    const params = {
      fields: 'id',
      query: `${slackIdField}:${slackId}`
    }

    return bhFetch('search/Candidate?' + stringify(params))
      .then(res => res.data.data.map(({ _score, ...array }) => array)[0].id)
  },

  update: async (slackId, values) => {
    const bhId = await profiles.getBHId(slackId)

    return bhFetch(`entity/Candidate/${bhId}`, 'post', reassignSlackValues(values))
      .then(res => console.log(res))
      .catch(res => console.log(res))
  }
}

const slackIdField = 'customText10'

const jobFields = {
  'title': 'title',
}

const profileFields = {
  'address': 'location',
  'customText2': 'availability',
  'dateAvailable': 'date_available',
  'customText6': 'english',
  'customText4': 'cms',
  'customText3': 'titles',
  'customText1': 'languages',
  'primarySkills': 'skills',
  'customText5': 'citizen',
  'customText8': 'drupal_profile',
  'customTextBlock2': 'drupal_bio',
  'customText11': 'wp_experience',
  'customTextBlock3': 'wp_bio',
  'customTextBlock4': 'tasks',
}

const reassignBHValues = values => Object.keys(values).reduce((acc, key) => {
    if (profileFields[key] != null) {
      acc[profileFields[key]] = values[key]
    }

    return acc
  }, {})

const reassignSlackValues = values => Object.keys(values).reduce((acc, key) => {
      const mappedKey = Object.keys(profileFields).find(field => profileFields[field] == key)
      if (key == 'date_available') {
        const [year, month, day] = values[key].split('-')
        acc[mappedKey] = new Date(year, month - 1, day).getTime()
      }
      else {
        acc[mappedKey] = values[key]
      }

      return acc
    }, {})

const reduceSkills = skills => skills.data.map(skill => skill.name)

// Todo: Remove this function.
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
