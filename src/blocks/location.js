const { Client, Status } = require('@googlemaps/google-maps-services-js')

const api = require('../util/api')()
const getProfileHome = require('../event/getProfileHome')
const { profilesRef } = require('../util/firebase')
const travisBuild = require('../util/travis')

module.exports.dialog = async payload => {
  const profile = (await profilesRef().doc(payload.user.id).get()).data() || {}

  const dialog = {
    token: process.env.SLACK_TOKEN_BOT,
    trigger_id: payload.trigger_id,
    dialog: JSON.stringify({
      title: 'Look up my address',
      callback_id: 'update_location',
      submit_label: 'Lookup',
      elements: [
        {
          "label": "Location",
          "type": "text",
          "name": "location",
          "placeholder": "i.e. Olympia, WA"
        }
      ]
    })
  }

  return api.post('dialog.open', null, { params: dialog })
    .then(() => ({ statusCode: 200, body: '' }))
    .catch((e) => { console.log('dialog.open call failed: %o', e) })
}

module.exports.update = async payload => {
  const client = new Client({});
  const location = await client.geocode({
    params: {
      address: payload.submission.location,
      key: process.env.GOOGLE_MAPS
    },
    timeout: 1000
  })
  .then(r => {
    if (r.data.status === Status.OK) {
      const address_elements = ['administrative_area_level_1', 'locality', 'country']
      return r.data.results[0].address_components
        .filter(component => component.types.some(type => address_elements.includes(type)))
        .reduce((acc, item, index, src) => {
          if (index < src.length - 1) {
            return acc + item.long_name + ', '
          }
          return acc + item.short_name
        }, '')
    } else {
      console.log(r.data.error_message);
    }
  })
  .catch((e) => {
    console.log(e);
  })

  // Update profile data.
  await profilesRef().doc(payload.user.id).set({ location: location }, { merge: true })
    .then(res => console.log(res))
    .catch(e => console.log(e))

  await getProfileHome(payload.user.id)

  travisBuild()

  return { statusCode: 200, body: '' }
}
