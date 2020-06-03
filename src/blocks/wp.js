const api = require('../util/api')()
const { profilesRef } = require('../util/firebase')
const keyValue = require('../util/keyValue')
const travisBuild = require('../util/travis')
const verifyData = require('../util/verifyData')

module.exports.blocks = (base_url, id) => {
  const url = base_url + 'profile/' + id.toLowerCase()
  const link = '<' + url + '|' + 'View my Wordpress Profile>'

  return [
    {
      "type": "section",
      "block_id": "wp_profile",
      "text": {
        "type": "mrkdwn",
        "text": link
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Edit WP Profile",
        },
        "value": "wp_profile"
      }
    }
  ]
}

module.exports.dialog = async payload => {
  const profile = await profilesRef().doc(payload.user.id).get().then(doc => doc.data()) || {}

  const dialog = {
    token: process.env.SLACK_TOKEN_BOT,
    trigger_id: payload.trigger_id,
    dialog: JSON.stringify({
      title: 'Update my WP profile',
      callback_id: 'update_wp_profile',
      submit_label: 'Save',
      elements: [
        {
          "label": "WP bio",
          "type": "textarea",
          "name": "wp_bio",
          "value": profile.wp_bio || '',
          "placeholder": "I'm awesome at WordPress because...",
        },
        {
          "label": "Experience level",
          "type": "select",
          "name": "wp_experience",
          "placeholder": "Choose your experience level...",
          "value": profile.wp_experience || '',
          "options": [
            {
              "label": keyValue.entry,
              "value": "entry",
            },
            {
              "label": keyValue.intermediate,
              "value": "intermediate",
            },
            {
              "label": keyValue.expert,
              "value": "expert",
            }
          ]
        }
      ]
    })
  }

  return api.post('dialog.open', null, { params: dialog })
    .then(() => ({ statusCode: 200, body: '' }))
    .catch((e) => { console.log('dialog.open call failed: %o', e) })
}

module.exports.updateProfile = async payload => {
  // Check for valid data.
  const errors = await verifyData(payload.submission)

  if (errors.length > 0) return { statusCode: 200, body: JSON.stringify({ errors: errors }) }

  // Update profile data.
  await profilesRef().doc(payload.user.id).set(payload.submission, { merge: true })
    .then(res => console.log(res))
    .catch(e => console.log(e))

  travisBuild()

  return { statusCode: 200, body: '' }
}
