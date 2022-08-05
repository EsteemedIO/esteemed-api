import { fetch as bhFetch, depaginate } from 'bullhorn-auth'
import { reassignBHValues } from '../util/slackUtils.js'
import { profiles } from './profiles.js'
import htmlentities from 'html-entities'
const { decode } = htmlentities
import qs from 'qs'
const { stringify } = qs

export async function getAll(filters) {
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
}

export async function get(item) {
  const params = {
    fields: Object.keys(jobFields).join(','),
  }

  // Fetch the BH data, then re-assign values to proper keys.
  return bhFetch(`entity/JobOrder/${item}?` + stringify(params))
    .then(res => reassignBHValues(jobFields, res.data.data))
    .catch(e => console.log(e))
}

export async function getJobUpdate(subscriptionId = null) {
  let params = { maxEvents: 200 }

  if (subscriptionId) {
    params.requestId = subscriptionId
  }

  return bhFetch('event/subscription/jobUpdate?' + stringify(params))
    .then(({ data }) => (data !== ''))
    .catch(e => console.error(e.response.data))
}

export async function getPriorityJobs(temp) {
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
}

export async function getSubscription(subscriptionId = null) {
  let params = { maxEvents: 200 }

  if (subscriptionId) {
    params.requestId = subscriptionId
  }

  return bhFetch('event/subscription/newJobPosts?' + stringify(params))
    .then(subscription => subscription.data != '' ? subscription.data.events.map(event => event.entityId) : [])
    .catch(e => console.error(e))
}

export async function getNotes(item) {
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
}

export async function addNote(jobId, slackId, notes) {
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
}

export async function post(item) {
//  const params = {
//    TableName: 'jobs',
//    Item: item
//  }
//  return await db.put(params).promise()
}

export async function update(jobId, job) {
//  const params = formatDBQuery(job)
//  params.TableName = 'jobs'
//  params.Key = { id: jobId }
//
//  if (job.active !== undefined) {
//    params.UpdateExpression = params.UpdateExpression + ', active = :active'
//    params.ExpressionAttributeValues[':active'] = job.active
//  }
//
//  return db.update(params).promise()
}

export function locationFormat(address) {
  return [address.city, address.state].filter(i => i !== null).join(', ')
}

const jobFields = {
  'id': 'id',
  'title': 'title',
  'dateAdded': 'dateAdded',
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
