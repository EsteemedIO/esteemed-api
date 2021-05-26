import { fetch as bhFetch, reassignBHValues, reassignSlackValues } from '../util/bullhorn.js'
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

  getAll: async (limit = null) => {
    let allRecords = []
    const params = {
      fields: Object.keys(profileFields).join(','),
      query: 'isDeleted:FALSE',
      sort: '-dateAdded'
    }

    params.count = limit ? limit : 200

    // Iterate queries to account for 500 record limit (200 record limit when
    // querying skills).
    async function doQuery(start) {
      if (start) params.start = start

      return await bhFetch('search/Candidate?' + stringify(params))
        .then(res => {
          allRecords = allRecords.concat(res.data.data)
          return (!limit && res.data.data.length >= params.count) ? doQuery(allRecords.length) : allRecords
        })
        .catch(e => console.error(e))
    }

    return doQuery()
      .then(res => res.map(item => reassignBHValues(profileFields, item)))
      .then(profiles => profiles.map(profile => ({ ...profile, ...{
          skills: profile.skills.data.map(value => value.name),
          date_available: profile.date_available ? new Date(profile.date_available).toISOString().split('T')[0] : null,
        }})))
  },
  getPinpoint: async (limit = null) => {
    let allRecords = []
    const params = {
      fields: 'phone,firstName,lastName,companyName,address,id',
      query: 'isDeleted:FALSE',
      sort: '-dateAdded'
    }

    params.count = limit ? limit : 200

    // Iterate queries to account for 500 record limit (200 record limit when
    // querying skills).
    async function doQuery(start) {
      if (start) params.start = start

      return await bhFetch('search/Candidate?' + stringify(params))
        .then(res => {
          allRecords = allRecords.concat(res.data.data)
          return (!limit && res.data.data.length >= params.count) ? doQuery(allRecords.length) : allRecords
        })
        .catch(e => console.error(e))
    }

    return doQuery()
      .then(res => res.filter(i => i.phone !== null && i.phone !== '' ))
      .then(profiles => profiles.map(profile => {
        const cityLookup = profile.address.city ? timezones.lookupViaCity(profile.address.city)[0] : null
        const tz = cityLookup ? cityLookup.timezone : ''
        const country = cityLookup ? cityLookup.iso3 : ''

        return [
          'SMS',
          profile.phone.replace(/[^0-9\+]/gi, ''),
          profile.phone.replace(/[^0-9\+]/gi, ''),
          country,
          profile.firstName,
          profile.lastName,
          profile.companyName,
          profile.address.address1,
          profile.address.address2,
          profile.address.city,
          profile.address.state,
          profile.address.countryName,
          profile.address.zip,
          'NONE',
          tz,
          'en_US',
          profile.id,
        ]

        return {
          channelType: 'SMS',
          Address: profile.phone,
          'Attributes.Address': profile.phone,
          'Location.Country': country,
          'User.UserAttributes.FirstName': profile.firstName,
          'User.UserAttributes.LastName': profile.lastName,
          'User.UserAttributes.Company': profile.companyName,
          'User.UserAttributes.MailingStreet1': profile.address.address1,
          'User.UserAttributes.MailingStreet2': profile.address.address2,
          'User.UserAttributes.MailingCity': profile.address.city,
          'User.UserAttributes.MailingRegion': profile.address.state,
          'User.UserAttributes.MailingCountry': profile.address.countryName,
          'User.UserAttributes.PostalCode': profile.address.zip,
          'OptOut': 'NONE',
          'Demographic.Timezone': tz,
          'Demographic.Locale': 'en_US',
          'User.UserAttributes.RefNumber': profile.id,
        }
      }))
      .then(data => ([
        [
          'channelType',
          'Address',
          'Attributes.Address',
          'Location.Country',
          'User.UserAttributes.FirstName',
          'User.UserAttributes.LastName',
          'User.UserAttributes.Company',
          'User.UserAttributes.MailingStreet1',
          'User.UserAttributes.MailingStreet2',
          'User.UserAttributes.MailingCity',
          'User.UserAttributes.MailingRegion',
          'User.UserAttributes.MailingCountry',
          'User.UserAttributes.PostalCode',
          'OptOut',
          'Demographic.Timezone',
          'Demographic.Locale',
          'User.UserAttributes.RefNumber',
        ],
        ...data
      ]))
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
  'customText12': 'resume',
  'email': 'email',
  'employeeType': 'employeeType',
  'source': 'source'
}
