const { Client, Status } = require('@googlemaps/google-maps-services-js')

const api = require('../util/api')
const getProfileHome = require('../event/getProfileHome')
const dynamodb = require('../util/dynamodb')

module.exports.dialog = async (payload, res) => {
  const dialog = {
    token: process.env.SLACK_TOKEN_BOT,
    trigger_id: payload.trigger_id,
    dialog: JSON.stringify({
      title: 'Look up my address',
      callback_id: 'update_location',
      submit_label: 'Lookup',
      elements: [
        {
          label: 'Location',
          type: 'text',
          name: 'locality',
          placeholder: 'i.e. Olympia, WA'
        }
      ]
    })
  }

  await api.user().post('dialog.open', null, { params: dialog })
    .then(data => {
      console.log(data)
      res.send()
    })
}

module.exports.update = async payload => {
  const client = new Client({})
  const location = await client.geocode({
    params: {
      address: payload.submission.locality,
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
      id: payload.user.id
    },
    UpdateExpression: 'set locality = :locality',
    ExpressionAttributeValues: {
      ':locality': location
    }
  }

  await dynamodb.update(params).promise()
    .then(res => console.log(res))
    .catch(e => console.log(e))

  await getProfileHome(payload.user.id)

  return { statusCode: 200, body: '' }
}
