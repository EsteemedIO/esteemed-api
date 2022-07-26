import { depaginate } from 'bullhorn-auth'

export default {
  get: async email => {
    return getAll()
      .then(res => res.filter(placement => placement.candidate.email == email))
  },
  getAll: async (filters) => {
    const defaults = {
      fields: 'candidate(email),dateBegin,dateEnd,payRate,clientBillRate,jobOrder(clientCorporation),dateAdded',
      query: `status:(Approved OR Completed OR Terminated)`,
      sort: '-dateAdded',
      count: 200
    }

    const params = {...defaults, ...filters}

    return depaginate('search/Placement', params)
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
