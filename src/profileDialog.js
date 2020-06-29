const qs = require('query-string')
const { Client, Status } = require('@googlemaps/google-maps-services-js')

const api = require('./util/api')()
const { profilesRef } = require('./util/firebase')
const verifyData = require('./util/verifyData')
const verifyRequest = require('./verifyRequest')
const getProfileHome = require('./event/getProfileHome')
const drupal = require('./blocks/drupal')
const wp = require('./blocks/wp')
const location = require('./blocks/location')
const keyValue = require('./util/keyValue')
const travisBuild = require('./util/travis')

exports.handler = async (event) => {
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!');
    return 'Lambda is warm!';
  }

  try {
    const payload = JSON.parse(qs.parse(event.body).payload)
    const slackSignature = event.headers['X-Slack-Signature']
    const timestamp = event.headers['X-Slack-Request-Timestamp']
    const verified = await verifyRequest(slackSignature, event.body, timestamp)

    // Return errors if request validation fails.
    if (verified.statusCode == 400) return verified

    if (payload.view && payload.view.type == 'home' && payload.type && payload.type == 'block_actions') {
      // Update Home page options.
      if (payload.actions[0].type == 'multi_static_select'
        || payload.actions[0].type == 'datepicker'
        || payload.actions[0].type == 'static_select') {
        return await updateProfileHome(payload)
      }

      // Get Drupal dialog upon button click.
      if (payload.actions[0].block_id == 'drupal_profile') {
        return await drupal.dialog(payload)
      }

      // Get WP dialog upon button click.
      if (payload.actions[0].block_id == 'wp_profile') {
        return await wp.dialog(payload)
      }

      // Get location lookup dialog upon button click.
      if (payload.actions[0].block_id == 'location') {
        return await location.dialog(payload)
      }
    }

    // Update Drupal profile.
    if (payload.type && payload.type == 'dialog_submission') {
      if (payload.callback_id == 'update_drupal_profile') {
        return await drupal.updateProfile(payload)
      }

      if (payload.callback_id == 'update_wp_profile') {
        return await wp.updateProfile(payload)
      }

      if (payload.callback_id == 'update_location') {
        return await location.update(payload)
      }
    }

  } catch (e) {
    console.log(e)
    return {
      statusCode: 400,
      body: JSON.stringify(e)
    }
  }
}

const updateProfileHome = async payload => {
  // Check for valid data.
  //const errors = await verifyData(payload.submission)

  //if (errors.length > 0) return { statusCode: 200, body: JSON.stringify({ errors: errors }) }

  const type = payload.actions[0].type
  const action_id = payload.actions[0].action_id
  let values = []

  if (type == 'static_select') {
    values = payload.actions[0].selected_option.value
  }
  else if (type == 'multi_static_select') {
    values = payload.actions[0].selected_options.map(option => option.value)
  }
  else if (type == 'datepicker') {
    values = payload.actions[0].selected_date
  }

  let data = {}
  data[action_id] = values

  // Update profile data.
  await profilesRef().doc(payload.user.id).set(data, { merge: true })
    .then(res => console.log(res))
    .catch(e => console.log(e))

  travisBuild()

  await getProfileHome(payload.user.id)

  return { statusCode: 200, body: '' }
}
