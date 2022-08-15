import { fetch as bhFetch, depaginate } from 'bullhorn-auth'
import qs from 'qs'
const { stringify } = qs

export const references = {
  get: async referenceId => {
    const params = {
      fields: Object.keys(referenceFields).join(','),
    }

    return bhFetch(`entity/CandidateReference/${referenceId}?` + stringify(params))
      .then(reference => reference.data.data)
      .catch(e => console.error(e))
  },
  getAll: async (filters) => {
    const defaults = {
      fields: Object.keys(referenceFields).join(','),
      where: 'isDeleted=FALSE',
    }

    const params = {...defaults, ...filters}

    return depaginate('query/CandidateReference', params)
      .catch(e => console.error(e))
  },
  getSubscription: async (subscriptionId = null) => {
    let params = { maxEvents: 200 }

    if (subscriptionId) {
      params.requestId = subscriptionId
    }

    return bhFetch('event/subscription/newCandidateReference?' + stringify(params))
      .then(subscription => subscription.data != '' ? subscription.data.events.map(event => event.entityId) : [])
      .catch(e => console.error(e))
  },
  getLeads: async (referenceId = null) => referenceId ? [ await references.get(referenceId) ] : await references.getAll(),
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
  'status': 'status'
}
