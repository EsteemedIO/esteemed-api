import { fetch as bhFetch, depaginate } from 'bullhorn-auth'
import { reassignBHValues, reassignSlackValues } from '../util/slackUtils.js'
import qs from 'qs'
const { stringify } = qs

// Profile Calls
export const profiles = {
  get: async slackId => {
    const params = {
      fields: Object.keys(profileFields).join(','),
      meta: 'basic',
      query: `${slackIdField}:${slackId}`
    }

    // Fetch the BH data, then re-assign values to proper keys.
    return bhFetch('search/Candidate?' + stringify(params))
      .then(res => reassignBHValues(profileFields, res.data.data[0]))
      .then(profile => ({ ...profile, ...{
          skills: profile.skills.data.map(value => value.name),
          date_available: profile.date_available ? new Date(profile.date_available).toISOString().split('T')[0] : null,
        }}))
      .catch(e => console.error(e))
  },
  getDisplay: async slackId => {
    const params = {
      fields: Object.keys(profileFields).join(','),
      meta: 'basic',
      query: `${slackIdField}:${slackId}`
    }

    // Fetch the BH data, then re-assign values to proper keys.
    return bhFetch('search/Candidate?' + stringify(params))
      .then(res => Object.keys(res.data.data[0]).reduce((acc, fieldMeta) => {
          const value = res.data.data[0][fieldMeta]
          const meta = res.data.meta.fields.find(field => field.name == fieldMeta)

          if (fieldMeta.includes('customText') && value && meta && meta.options && value instanceof Array) {
            acc[fieldMeta] = value.map(v => meta.options.find(option => option.value == v)['label'])
          }
          else if (fieldMeta.includes('customText') && value && meta && meta.options) {
            acc[fieldMeta] = meta.options.find(option => option.value == value)['label']
          }
          else {
            acc[fieldMeta] = value
          }

          return acc
        }, {}))
      .then(res => reassignBHValues(profileFields, res))
      .then(profile => ({ ...profile, ...{
          skills: profile.skills.data.map(value => value.name),
          date_available: profile.date_available ? new Date(profile.date_available).toISOString().split('T')[0] : null,
          titles: profile.titles !== null ? profile.titles : [],
          languages: profile.languages !== null ? profile.languages : [],
          cms: profile.cms !== null ? profile.cms : []
        }}))
      .catch(e => console.error(e))
  },
  getEducation: async slackId => {
    const bhId = await profiles.getBHId(slackId)

    const params = {
      fields: 'school,city,state,degree,major,startDate,endDate',
      where: `candidate.id=${bhId}`
    }

    return bhFetch(`query/CandidateEducation?` + stringify(params))
      .then(res => res.data.data)
      .catch(res => console.error(res))
  },
  getWorkHistory: async slackId => {
    const bhId = await profiles.getBHId(slackId)

    const params = {
      fields: 'title,companyName,startDate,endDate',
      where: `candidate.id=${bhId}`
    }

    return bhFetch(`query/CandidateWorkHistory?` + stringify(params))
      .then(res => res.data.data)
      .catch(res => console.error(res))
  },

  getAll: async (filters) => {
    const defaults = {
      fields: Object.keys(profileFields).join(','),
      query: 'isDeleted:FALSE',
      sort: '-dateAdded',
      count: 200
    }

    const params = {...defaults, ...filters}

    return depaginate('search/Candidate', params)
      .then(res => res.map(item => reassignBHValues(profileFields, item)))
      .then(profiles => profiles.map(profile => ({ ...profile, ...{
          skills: profile.skills.data.map(value => value.name),
          date_available: profile.date_available ? new Date(profile.date_available).toISOString().split('T')[0] : null,
        }})))
  },
  getBHId: async slackId => {
    const params = {
      fields: 'id',
      query: `${slackIdField}:${slackId}`
    }

    return bhFetch('search/Candidate?' + stringify(params))
      .then(res => res.data.data.map(({ _score, ...array }) => array)[0].id)
  },
  getBHIdByEmail: async email => {
    const params = {
      fields: 'id',
      query: `email:${email}`
    }

    return bhFetch('search/Candidate?' + stringify(params))
      .then(res => {
        const results = res.data.data.map(({ _score, ...array }) => array)
        if (results.length > 0) {
          return results[0].id
        }
        else {
          return false
        }
      })
  },
  getRates: async bhId => {
    const params = {
      fields: 'hourlyRate'
    }

    return bhFetch(`entity/Candidate/${bhId}?` + stringify(params))
      .then(res => res.data.data)
      .catch(res => console.error(res))
  },
  add: async (values) => {
    return bhFetch(`entity/Candidate`, 'put', reassignSlackValues(profileFields, values))
      .catch(res => console.error(res))
  },

  update: async (bhId, values) => {
    return bhFetch(`entity/Candidate/${bhId}`, 'post', reassignSlackValues(profileFields, values))
      .catch(res => console.error(res))
  }
}

const slackIdField = 'customText10'

const profileFields = {
  'address': 'location',
  'customText2': 'availability',
  'dateAvailable': 'date_available',
  'name': 'name',
  'firstName': 'firstName',
  'lastName': 'lastName',
  'dateAdded': 'dateAdded',
  'customText6': 'english',
  'customText4': 'cms',
  'customText3': 'titles',
  'customText1': 'languages',
  'primarySkills': 'skills',
  'customText5': 'citizen',
  'customText8': 'drupal_profile',
  'customTextBlock2': 'drupal_bio',
  'customText11': 'wp_experience',
  'customTextBlock3': 'wp_bio',
  'customTextBlock4': 'tasks',
  'customText10': 'slackId',
  'customText12': 'resume',
  'customTextBlock10': 'coc_policy',
  'customText16': 'interested_in',
  'customText17': 'resources_excited',
  'customText18': 'discuss_opps',
  'customText19': 'work_preference',
  'occupation': 'occupation',
  'mobile': 'phone',
  'email': 'email',
  'employeeType': 'employeeType',
  'source': 'source'
}
