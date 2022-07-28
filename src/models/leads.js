import { fetch as bhFetch } from 'bullhorn-auth'
import { references } from './references.js'

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
  return references.getSubscription()
    .then(async subscription => await Promise.all(subscription.map(referenceId => references.get(referenceId))))
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
