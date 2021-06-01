import { fetch as bhFetch } from '../util/bullhorn.js'
import qs from 'qs'
const { stringify } = qs

export default {
  get: async email => {
    let allRecords = []
    const params = {
      fields: 'candidate(email),dateBegin,dateEnd,payRate,clientBillRate,jobOrder(clientCorporation)',
      query: `status:Approved`,
      count: 200
    }

    // Iterate queries to account for 500 record limit (200 record limit when
    // querying skills).
    async function doQuery(start) {
      if (start) params.start = start

      return await bhFetch('search/Placement?' + stringify(params))
        .then(res => {
          allRecords = allRecords.concat(res.data.data)
          return res.data.data.length >= params.count ? doQuery(allRecords.length) : allRecords
        })
        .then(data => data.map(({ _score, ...data }) => data))
        .catch(e => console.error(e))
    }

    return doQuery()
      .then(placements => placements.map(placement => ({
          ...placement,
          candidate: {
            ...placement.candidate,
            email: placement.candidate.email.toLowerCase()
          }
      })))
      .catch(err => console.log(err))
  },
}
