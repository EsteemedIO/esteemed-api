import { depaginate } from 'bullhorn-auth'

export default {
  getAll: async (filters) => {
    const defaults = {
      fields: 'title, dateAdded',
      where: 'isDeleted=FALSE',
      sort: '-dateAdded',
      count: 200
    }

    const params = {...defaults, ...filters}

    return depaginate('query/Opportunity', params)
  }
}
