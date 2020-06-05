const url = require('url')

const api = require('../util/api')()
const { profilesRef } = require('../util/firebase')
const keyValue = require('../util/keyValue')
const travisBuild = require('../util/travis')
const verifyData = require('../util/verifyData')

module.exports.blocks = (base_url, id) => {
  const url = base_url + 'profile/' + id.toLowerCase()
  const link = '<' + url + '|' + 'View my Drupal Profile>'

  return [
    {
      "type": "section",
      "block_id": "drupal_profile",
      "text": {
        "type": "mrkdwn",
        "text": link
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Edit Drupal Profile"
        },
        "value": "drupal_profile"
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
      title: 'Update my Drupal profile',
      callback_id: 'update_drupal_profile',
      submit_label: 'Save',
      elements: [
        {
          "label": "Drupal.org Profile link",
          "type": "text",
          "subtype": "url",
          "name": "drupal_profile",
          "value": profile.drupal_profile || '',
          "placeholder": "https://www.drupal.org/u/",
        },
        {
          "label": "Drupal Bio",
          "type": "textarea",
          "name": "drupal_bio",
          "value": profile.drupal_bio || '',
          "placeholder": "I'm awesome at Drupal because...",
        },
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

  // Normalize URL if users enter www subdomain.
  payload.submission.drupal_profile = 'https://drupal.org' + url.parse(payload.submission.drupal_profile).pathname

  // Update profile data.
  await profilesRef().doc(payload.user.id).set(payload.submission, { merge: true })
    .then(res => console.log(res))
    .catch(e => console.log(e))

  travisBuild()

  return { statusCode: 200, body: '' }
}
