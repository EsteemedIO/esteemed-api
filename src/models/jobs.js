import { fetch as bhFetch, reassignBHValues, depaginate } from '../util/bullhorn.js'
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
      .catch(e => console.error(e.response.data))
  },
  getAll: async (filters) => {
    const defaults = {
      fields: Object.keys(jobFields).join(','),
      where: 'isOpen=TRUE AND isPublic=1',
      count: 200
    }

    const params = {...defaults, ...filters}

    return depaginate('query/JobBoardPost', params)
      .then(jobs => jobs.map(job => reassignBHValues(jobFields, job)))
      .then(jobs => jobs.map(job => ({ ...job, ...{
          startDate: job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : null,
        }})))
      .catch(e => console.log(e.response))
  },
  getPriorityJobs: async (temp) => {
    let params = {
      fields: Object.keys(priorityFields).join(','),
      where: [
        'isOpen=true',
        'isPublic=1',
      ],
      count: 200,
    }

    if (temp) {
      params.where.push(`type=${temp}`)
    }

    params.where = params.where.join(' AND ')

    return await bhFetch('query/JobOrder?' + stringify(params))
      .then(jobs => jobs.data.data.map(job => reassignBHValues(priorityFields, job)))
      .then(jobs => jobs.map(job => ({ ...job, company: job.company.name })))
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

const priorityFields = {
  'id': 'id',
  'title': 'title',
  'clientCorporation': 'company',
  'employmentType': 'type',
  'payRate': 'pay',
}
