import { fetch as bhFetch } from '../util/bullhorn.js'
import qs from 'qs'
const { stringify } = qs

export default {
  get: async email => {
    console.log(email)
    const params = {
      fields: 'candidate(email),dateBegin,dateEnd,payRate,clientBillRate,jobOrder(clientCorporation)',
      query: `status:Approved`
    }

    return bhFetch('search/Placement?' + stringify(params))
      .then(res => res.data.data.map(({ _score, ...array }) => array))
      .then(res => res.filter(placement => placement.candidate.email == email))
      .catch(err => console.log(err))
  },
}
