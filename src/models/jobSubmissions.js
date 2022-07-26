import { depaginate } from 'bullhorn-auth'

// Profile Calls
export const submissions = {
  getAll: async (filters) => {
    const defaults = {
      fields: Object.keys(profileFields).join(','),
      query: 'isDeleted:FALSE',
      sort: '-dateAdded',
      count: 200
    }

    const params = {...defaults, ...filters}

    return depaginate('search/JobSubmission', params)
  }
}

const profileFields = {
  'dateAdded': 'dateAdded',
  'jobOrder': 'jobOrder',
  'sendingUser': 'sendingUser',
  'status': 'status',
}
