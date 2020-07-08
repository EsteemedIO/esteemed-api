const api = require('../util/api')()
const dynamodb = require('../util/dynamodb')
const keyValue = require('../util/keyValue')
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
        "text": 'Click the button to the right to edit your WP profile'
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

  await api.post('dialog.open', null, { params: dialog })
    .then(data => console.log(data))
    .catch((e) => { console.log('dialog.open call failed: %o', e) })
}

module.exports.updateProfile = async payload => {
  // Check for valid data.
  const errors = await verifyData(payload.submission)

  if (errors.length > 0) return { statusCode: 200, body: JSON.stringify({ errors: errors }) }

  // Update profile data.
  let params = {
    TableName: "profiles",
    Key: {
      id: payload.user.id
    },
    UpdateExpression: `set wp_experience = :wp_experience, wp_bio = :wp_bio`,
    ExpressionAttributeValues: {
      ':wp_experience': payload.submission.wp_experience,
      ':wp_bio': payload.submission.wp_bio
    }
  }

  await dynamodb.update(params).promise()
    .then(res => console.log(res))
    .catch(e => console.log(e))
}
