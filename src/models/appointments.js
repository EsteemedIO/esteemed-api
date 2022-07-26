import { depaginate } from 'bullhorn-auth'

// Profile Calls
export const appointments = {
  getAll: async (filters) => {
    const defaults = {
      fields: Object.keys(profileFields).join(','),
      where: 'isDeleted = FALSE',
      sort: '-dateAdded',
      count: 200
    }

    const params = {...defaults, ...filters}

    return depaginate('query/Appointment', params)
  }
}

const profileFields = {
  'dateAdded': 'dateAdded',
  'jobOrder': 'jobOrder',
  'type': 'type',
}
