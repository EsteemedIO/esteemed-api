import { Client, Status } from '@googlemaps/google-maps-services-js'

import db from '../util/dynamodb'

export async function modal() {
  return {
    title: {
      type: 'plain_text',
      text: 'Location'
    },
    callback_id: 'update_location',
    submit: {
      type: 'plain_text',
      text: 'Lookup'
    },
    close: {
      type: 'plain_text',
      text: 'Cancel'
    },
    type: 'modal',
    blocks: [{
      type: 'input',
      block_id: 'update_location',
      element: {
        type: 'plain_text_input',
        action_id: 'val',
        placeholder: {
          type: 'plain_text',
          text: 'i.e. Olympia, WA'
        }
      },
      label: {
        type: 'plain_text',
        text: 'Location'
      }
    }]
  }
}

export async function update(user, locality) {
  const client = new Client({})
  const location = await client.geocode({
    params: {
      address: locality,
      key: process.env.GOOGLE_MAPS
    },
    timeout: 1000
  })
    .then(r => {
      if (r.data.status === Status.OK) {
        const addressElements = ['administrative_area_level_1', 'locality', 'country']
        return r.data.results[0].address_components
          .filter(component => component.types.some(type => addressElements.includes(type)))
          .reduce((acc, item, index, src) => {
            if (index < src.length - 1) {
              return acc + item.long_name + ', '
            }
            return acc + item.short_name
          }, '')
      } else {
        console.log(r.data.error_message)
      }
    })
    .catch((e) => {
      console.log(e)
    })

  // Update profile data.
  const params = {
    TableName: 'profiles',
    Key: {
      id: user
    },
    UpdateExpression: 'set locality = :locality',
    ExpressionAttributeValues: {
      ':locality': location
    }
  }

  await db.update(params).promise()
    .then(res => console.log(res))
    .catch(e => console.log(e))
}
