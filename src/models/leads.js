import { fetch as bhFetch } from 'bullhorn-auth'
import { get as getReferences, getSubscription } from './references.js'

export async function add(lead) {
  const params = leadFields(lead)

  return bhFetch('entity/Lead', 'put', params)
    .catch(e => console.error(e))
}

export async function update(bhId, values) {
  return bhFetch(`entity/Lead/${bhId}`, 'post', reassignSlackValues(leadFields, values))
    .catch(res => console.error(res))
}

export async function getNew() {
  return getSubscription()
    .then(async subscription => await Promise.all(subscription.map(referenceId => getReferences(referenceId))))
    .catch(e => console.error(e))
}

const leadFields = (lead) => ({
  firstName: lead.referenceFirstName,
  lastName: lead.referenceLastName,
  title: lead.referenceTitle,
  email: lead.referenceEmail,
  phone: lead.referencePhone,
  companyName: lead.companyName,
  leadSource: 'Reference',
})
