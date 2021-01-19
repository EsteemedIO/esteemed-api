import { profiles } from '../models/profiles.js'
import { get as getSlackData } from '../util/slackFormData.js'
import { countryOption } from '../util/countryCodes.js'

export function modal(location) {
  return {
    title: {
      type: 'plain_text',
      text: 'Address'
    },
    callback_id: 'update_location',
    submit: {
      type: 'plain_text',
      text: 'Save'
    },
    close: {
      type: 'plain_text',
      text: 'Cancel'
    },
    type: 'modal',
    blocks: [
      {
        type: 'input',
        block_id: 'address1',
        element: {
          type: 'plain_text_input',
          action_id: 'val',
          initial_value: location.address1 ? location.address1 : '',
          placeholder: {
            type: 'plain_text',
            text: 'Address 1',
          }
        },
        label: {
          type: 'plain_text',
          text: 'Address',
        }
      },
      {
        type: 'input',
        block_id: 'address2',
        optional: true,
        element: {
          type: 'plain_text_input',
          action_id: 'val',
          initial_value: location.address2 ? location.address2 : '',
          placeholder: {
            type: 'plain_text',
            text: 'Address 2',
          }
        },
        label: {
          type: 'plain_text',
          text: 'Address2'
        }
      },
      {
        type: 'input',
        block_id: 'city',
        element: {
          type: 'plain_text_input',
          action_id: 'val',
          initial_value: location.city ? location.city : '',
          placeholder: {
            type: 'plain_text',
            text: 'City',
          }
        },
        label: {
          type: 'plain_text',
          text: 'City'
        }
      },
      {
        type: 'input',
        block_id: 'state',
        element: {
          type: 'plain_text_input',
          action_id: 'val',
          initial_value: location.state ? location.state : '',
          placeholder: {
            type: 'plain_text',
            text: 'State',
          }
        },
        label: {
          type: 'plain_text',
          text: 'State'
        }
      },
      {
        type: 'input',
        block_id: 'zip',
        element: {
          type: 'plain_text_input',
          action_id: 'val',
          initial_value: location.zip ? location.zip : '',
          placeholder: {
            type: 'plain_text',
            text: 'Zip',
          }
        },
        label: {
          type: 'plain_text',
          text: 'Zip'
        }
      },
      {
        type: 'input',
        block_id: 'countryID',
        element: {
          type: 'external_select',
          action_id: 'bh_country_codes',
          initial_option: location.countryID ? countryOption(location.countryID) : countryOption('2378'),
          placeholder: {
            type: 'plain_text',
            text: 'Country',
          },
          min_query_length: 3
        },
        label: {
          type: 'plain_text',
          text: 'Country'
        }
      }
    ]
  }
}

export async function update(user, locality) {
  // Update profile data.
  return profiles.update(user, { location: getSlackData(locality) })
}
