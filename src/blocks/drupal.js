const url = require('url')

const api = require('../util/api')
const dynamodb = require('../util/dynamodb')
const verifyData = require('../util/verifyData')

module.exports.blocks = () => {
  return [
    {
      "type": "section",
      "block_id": "drupal_profile",
      "text": {
        "type": "mrkdwn",
        "text": 'Click the button to the right to edit your Drupal profile'
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
  let params = {
    TableName: "profiles",
    Key: {
      id: payload.user.id
    }
  }
  const profile = (await dynamodb.get(params).promise().then(({ Item }) => Item) || {})

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

  await api.user().post('dialog.open', null, { params: dialog })
    .then(() => ({ statusCode: 200, body: '' }))
    .catch((e) => { console.log('dialog.open call failed: %o', e) })
}

module.exports.updateProfile = async payload => {
  // Check for valid data.
  const errors = await verifyData(payload.submission)

  if (errors.length > 0) return { statusCode: 200, body: JSON.stringify({ errors: errors }) }

  // Normalize URL if users enter www subdomain.
  let drupal_profile = 'https://drupal.org' + url.parse(payload.submission.drupal_profile).pathname

  // Update profile data.
  let params = {
    TableName: "profiles",
    Key: {
      id: payload.user.id
    },
    UpdateExpression: `set drupal_profile = :drupal_profile, drupal_bio = :drupal_bio`,
    ExpressionAttributeValues: {
      ':drupal_profile': drupal_profile,
      ':drupal_bio': payload.submission.drupal_bio
    }
  }

  await dynamodb.update(params).promise()
    .then(res => console.log(res))
    .catch(e => console.log(e))
}
