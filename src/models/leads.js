import { fetch as bhFetch } from '../util/bullhorn.js'
import { references } from './references.js'

export const leads = {
  add: async lead => {
    const params = {
      fields: leadFields(lead)
    }

    return bhFetch('entity/Lead', 'put', params)
      .catch(e => console.error(e))
  },
  getNew: async () => {
    return references.getSubscription()
      .then(async subscription => await Promise.all(subscription.map(referenceId => references.get(referenceId))))
      .catch(e => console.error(e))
  }
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
