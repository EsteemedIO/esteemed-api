import { stringify } from 'qs'
import { fetch as bhFetch } from './bullhorn'

// Job Calls
const jobs = {
  get: async (item) => {
    const params = {
      fields: Object.keys(jobFields).join(','),
    }

    // Fetch the BH data, then re-assign values to proper keys.
    return bhFetch(`entity/JobOrder/${item}?` + stringify(params))
      .then(res => reassignBHValues(jobFields, res.data.data))
      .catch(e => console.log(e))
  },

  getAll: async () => {
    const params = {
      fields: Object.keys(jobFields).join(','),
      query: [
        'isDeleted:false',
        'isOpen:true',
      ].join(' AND '),
      count: 200,
    }

    return await bhFetch('search/JobOrder?' + stringify(params))
      .then(jobs => jobs.data.data.map(job => reassignBHValues(jobFields, job)))
      .then(jobs => jobs.map(job => ({ ...job, ...{
          startDate: job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : null,
          type: job.type ? ['Hot', 'Warm', 'Cold'][job.type - 1] : null,
        }})))
      .catch(e => console.log(e))
  },

  post: async (item) => {
//    const params = {
//      TableName: 'jobs',
//      Item: item
//    }
//    return await db.put(params).promise()
  },

  update: async (jobId, job) => {
//    const params = formatDBQuery(job)
//    params.TableName = 'jobs'
//    params.Key = { id: jobId }
//
//    if (job.active !== undefined) {
//      params.UpdateExpression = params.UpdateExpression + ', active = :active'
//      params.ExpressionAttributeValues[':active'] = job.active
//    }
//
//    return db.update(params).promise()
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
      .then(res => reassignBHValues(profileFields, res.data.data[0]))
      .then(profile => ({ ...profile, ...{
          skills: reduceSkills(profile.skills),
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
      .then(res => res.map(item => reassignBHValues(profileFields, item)))
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

    return bhFetch(`entity/Candidate/${bhId}`, 'post', reassignSlackValues(profileFields, values))
      .then(res => console.log(res))
      .catch(res => console.log(res))
  }
}

const slackIdField = 'customText10'

const jobFields = {
  'id': 'id',
  'title': 'title',
  'status': 'status',
  'type': 'type',
  'startDate': 'startDate',
  'payRate': 'payRate',
  'onSite': 'onSite',
  'numOpenings': 'numOpenings',
  'notes': 'notes',
  'hoursPerWeek': 'hoursPerWeek',
  'durationWeeks': 'durationWeeks',
  'description': 'description',
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

const reassignBHValues = (fields, values) => Object.keys(values).reduce((acc, key) => {
    if (fields[key] != null) {
      acc[fields[key]] = values[key]
    }

    return acc
  }, {})

const reassignSlackValues = (fields, values) => Object.keys(values).reduce((acc, key) => {
      const mappedKey = Object.keys(fields).find(field => fields[field] == key)
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

export {
  jobs,
  profiles
}
