import { fetch as bhFetch, reassignBHValues, reassignSlackValues } from '../util/bullhorn.js'
import qs from 'qs'
const { stringify } = qs

// Profile Calls
export const profiles = {
  get: async slackId => {
    const params = {
      fields: Object.keys(profileFields).join(','),
      query: `${slackIdField}:${slackId}`
    }

    // Fetch the BH data, then re-assign values to proper keys.
    return bhFetch('search/Candidate?' + stringify(params))
      .then(res => reassignBHValues(profileFields, res.data.data[0]))
      .then(profile => ({ ...profile, ...{
          skills: reduceSkills(profile.skills),
          date_available: profile.date_available ? new Date(profile.date_available).toISOString().split('T')[0] : null,
        }}))
      .catch(e => console.error(e))
  },

  getAll: async () => {
    let allRecords = []
    const params = {
      fields: Object.keys(profileFields).join(','),
      query: 'isDeleted:FALSE',
      count: 200,
    }

    // Iterate queries to account for 500 record limit (200 record limit when
    // querying skills).
    async function doQuery(start) {
      if (start) params.start = start

      return await bhFetch('search/Candidate?' + stringify(params))
        .then(res => {
          allRecords = allRecords.concat(res.data.data)
          return (res.data.data.length >= params.count) ? doQuery(allRecords.length) : allRecords
        })
        .catch(e => console.error(e))
    }

    return doQuery()
      .then(res => res.map(item => reassignBHValues(profileFields, item)))
      .then(profiles => profiles.map(profile => ({ ...profile, ...{
          skills: reduceSkills(profile.skills),
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
  add: async (values) => {
    return bhFetch(`entity/Candidate`, 'put', reassignSlackValues(profileFields, values))
      .catch(res => console.error(res))
  },

  update: async (slackId, values) => {
    const bhId = await profiles.getBHId(slackId)

    return bhFetch(`entity/Candidate/${bhId}`, 'post', reassignSlackValues(profileFields, values))
      .catch(res => console.error(res))
  }
}

const reduceSkills = skills => skills.data.map(skill => skill.name)

const slackIdField = 'customText10'

const profileFields = {
  'address': 'location',
  'customText2': 'availability',
  'dateAvailable': 'date_available',
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
  'email': 'email',
  'employeeType': 'employeeType',
  'source': 'source'
}
