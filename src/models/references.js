import { fetch as bhFetch, depaginate } from 'bullhorn-auth'
import qs from 'qs'
const { stringify } = qs

export async function get(referenceId) {
  const params = {
    fields: Object.keys(referenceFields).join(','),
  }

  return bhFetch(`entity/CandidateReference/${referenceId}?` + stringify(params))
    .then(reference => reference.data.data)
    .catch(e => console.error(e))
}

export async function getAll(filters) {
  const defaults = {
    fields: Object.keys(referenceFields).join(','),
    where: 'isDeleted=FALSE',
  }

  const params = {...defaults, ...filters}

  return depaginate('query/CandidateReference', params)
    .catch(e => console.error(e))
}

export async function getSubscription(subscriptionId = null) {
  let params = { maxEvents: 200 }

  if (subscriptionId) {
    params.requestId = subscriptionId
  }

  return bhFetch('event/subscription/newCandidateReference?' + stringify(params))
    .then(subscription => subscription.data != '' ? subscription.data.events.map(event => event.entityId) : [])
    .catch(e => console.error(e))
}
export async function getLeads(referenceId = null) {
  return referenceId ? [ await references.get(referenceId) ] : await references.getAll()
}

const referenceFields = {
  'id': 'id',
  'candidate': 'candidate',
  'referenceFirstName': 'referenceFirstName',
  'referenceLastName': 'referenceLastName',
  'referenceTitle': 'referenceTitle',
  'referenceEmail': 'referenceEmail',
  'referencePhone': 'referencePhone',
  'companyName': 'companyName',
  'dateAdded': 'dateAdded',
  'status': 'status'
}
