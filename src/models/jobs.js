import { fetch as bhFetch, reassignBHValues } from '../util/bullhorn.js'
import { profiles } from './profiles.js'
import htmlentities from 'html-entities'
const { decode } = htmlentities
import qs from 'qs'
const { stringify } = qs

export const jobs = {
  get: async (item) => {
    const params = {
      fields: Object.keys(jobFields).join(','),
    }

    // Fetch the BH data, then re-assign values to proper keys.
    return bhFetch(`entity/JobOrder/${item}?` + stringify(params))
      .then(res => reassignBHValues(jobFields, res.data.data))
      .catch(e => console.log(e))
  },
  getJobUpdate: async (subscriptionId = null) => {
    let params = { maxEvents: 200 }

    if (subscriptionId) {
      params.requestId = subscriptionId
    }

    return bhFetch('event/subscription/jobUpdate?' + stringify(params))
      .then(({ data }) => (data !== ''))
      .catch(e => console.error(e))
  },
  getAll: async () => {
    const params = {
      fields: Object.keys(jobFields).join(','),
      where: [
        'isOpen=true',
        'isPublic=1',
      ].join(' AND '),
      count: 200,
    }

    return await bhFetch('query/JobBoardPost?' + stringify(params))
      .then(jobs => jobs.data.data.map(job => reassignBHValues(jobFields, job)))
      .then(jobs => jobs.map(job => ({ ...job, ...{
          startDate: job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : null,
        }})))
      .catch(e => console.log(e.response.data.errorMessage))
  },

  getNotes: async (item) => {
    const params = {
      fields: 'notes(id,dateAdded,commentingPerson,comments)'
    }

    // Fetch the BH data, then re-assign values to proper keys.
    return bhFetch(`entity/JobOrder/${item}?` + stringify(params))
      .then(jobs => jobs.data.data.notes.data)
      .then(jobs => jobs.map(job => ({
        ...job,
        dateAdded: Math.floor(job.dateAdded / 1000),
        comments: decode(job.comments)
      })))
      .catch(e => console.log(e))
  },

  addNote: async (jobId, slackId, notes) => {
    const bhId = await profiles.getBHId(slackId)

    const params = {
      action: 'Slack Note',
      commentingPerson: { id: 3 },
      personReference: { id: bhId },
      jobOrder: { id: jobId },
      comments: notes
    }

    return bhFetch(`entity/Note`, 'put', params)
      .then(res => res.data.changedEntityId)
      .then(noteId => bhFetch(`entity/Note/${noteId}/jobOrders/${jobId}`, 'put'))
      .catch(res => console.error(res.response.data))
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

export function locationFormat(address) {
  return [address.city, address.state].filter(i => i !== null).join(', ')
}

const jobFields = {
  'id': 'id',
  'title': 'title',
  'startDate': 'startDate',
  'address': 'address',
  'employmentType': 'employmentType',
  'publicDescription': 'description',
}
