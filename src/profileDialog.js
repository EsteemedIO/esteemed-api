const axios = require('axios')
const qs = require('query-string')
const url = require('url')

const api = require('./api')()
const { profilesRef } = require('./firebase')
const verifyRequest = require('./verifyRequest')

exports.handler = async (event) => {
  try {
    const payload = JSON.parse(qs.parse(event.body).payload)
    const slackSignature = event.headers['X-Slack-Signature']
    const timestamp = event.headers['X-Slack-Request-Timestamp']
    const verified = await verifyRequest(slackSignature, event.body, timestamp)

    // Return errors if request validation fails.
    if (verified.statusCode == 400) return verified

    // Present user with dialog.
    if (payload.callback_id && payload.callback_id == 'update_profile') {
      return await getUpdateProfileDialog(payload)
    }

    // Process values from dialog.
    if (payload.callback_id && payload.callback_id == 'update_profile_submit') {
      return await submitProfile(payload)
    }
  } catch (e) {
    console.log(e)
    return {
      statusCode: 400,
      body: JSON.stringify(e)
    }
  }
}

const getUpdateProfileDialog = async payload => {
  const profile = await profilesRef().doc(payload.user.id).get().then(doc => doc.data()) || {}

  const dialog = {
    token: process.env.SLACK_TOKEN_BOT,
    trigger_id: payload.trigger_id,
    dialog: JSON.stringify({
      title: 'Update my profile',
      callback_id: 'update_profile_submit',
      submit_label: 'Save',
      elements: [
        {
          "label": "LinkedIn Profile URL",
          "type": "text",
          "subtype": "url",
          "placeholder": "https://www.linkedin.com/in/",
          "name": "linkedin",
          "value": profile.linkedin || '',
        },
        {
          "label": "I am a Drupal Developer",
          "type": "select",
          "name": "drupal",
          "value": profile.drupal || '',
          "options": [
            {
              "label": "No",
              "value": "No",
            },
            {
              "label": "Yes",
              "value": "Yes",
            },
          ],
        },
        {
          "label": "Drupal.org Profile link",
          "type": "text",
          "subtype": "url",
          "name": "drupal_profile",
          "value": profile.drupal_profile || '',
          "placeholder": "https://www.drupal.org/u/",
        },
        {
          "label": "I am a WordPress Developer",
          "type": "select",
          "name": "wordpress",
          "value": profile.wordpress || '',
          "options": [
            {
              "label": "No",
              "value": "No",
            },
            {
              "label": "Yes",
              "value": "Yes",
            },
          ],
        },
        {
          "label": "English Proficiency",
          "type": "select",
          "name": "english_proficiency",
          "value": profile.english_proficiency || '',
          "options": [
            {
              "label": "Elementary",
              "value": "Elementary",
            },
            {
              "label": "Intermediate",
              "value": "Intermediate",
            },
            {
              "label": "Native",
              "value": "Native",
            },
            {
              "label": "Proficient",
              "value": "Proficient",
            },
          ],
        },
        {
          "label": "Citizenship",
          "type": "select",
          "name": "citizenship",
          "value": profile.citizenship || '',
          "options": [
            {
              "label": "N/A",
              "value": "N/A",
            },
            {
              "label": "I am a citizen",
              "value": "I am a citizen",
            },
            {
              "label": "I am in need of citizenship",
              "value": "I am in need of citizenship",
            },
          ],
        },
      ]
    }),
  }

  return api.post('dialog.open', null, { params: dialog })
    .then(() => ({ statusCode: 200, body: '' }))
    .catch((e) => { console.log('dialog.open call failed: %o', e) })
}

const submitProfile = async payload => {
  // Check for valid data.
  const errors = await verifyData(payload.submission)

  if (errors.length > 0) return { statusCode: 200, body: JSON.stringify({ errors: errors }) }

  // Update profile data.
  profilesRef().doc(payload.user.id).set(payload.submission)

  api.post('chat.postMessage', qs.stringify({
      channel: payload.channel.id,
      text: 'Thanks for updating your profile!',
      token: process.env.SLACK_TOKEN_BOT,
    }))
    .catch(e => { console.log(e) })

  return { statusCode: 200, body: '' }
}

const verifyData = async submission => {
  let errors = []
  const linkedin = url.parse(submission.linkedin)
  const drupal = url.parse(submission.drupal_profile)

  // Apply heuristics.
  const linkedin_valid = (linkedin.host == 'linkedin.com') && (linkedin.pathname.split('/')[1] == 'in')
  const drupal_valid = (drupal.host == 'drupal.org') && (drupal.pathname.split('/')[1] == 'u')

  // Capture errors.
  if (!linkedin_valid) errors.push({ "name": "linkedin", "error": "This is not a valid LinkedIn URL" })
  if (!drupal_valid) errors.push({ "name": "drupal_profile", "error": "This is not a valid Drupal URL" })

  return errors
}
