const qs = require('query-string')
const url = require('url')

const api = require('./api')()
const { profilesRef } = require('./firebase')
const verifyRequest = require('./verifyRequest')
const getProfileHome = require('./event/getProfileHome')
const keyValue = require('./util/keyValue')
const travisBuild = require('./travis')

exports.handler = async (event) => {
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
        return await getDrupalProfileDialog(payload)
      }

      // Get WP dialog upon button click.
      if (payload.actions[0].block_id == 'wp_profile') {
        return await getWPProfileDialog(payload)
      }

      // Get location lookup dialog upon button click.
      if (payload.actions[0].block_id == 'location') {
        return await getLocationDialog(payload)
      }
    }

    // Update Drupal profile.
    if (payload.type && payload.type == 'dialog_submission') {
      if (payload.callback_id == 'update_drupal_profile') {
        return await updateDrupalProfile(payload)
      }

      if (payload.callback_id == 'update_wp_profile') {
        return await updateWPProfile(payload)
      }

      if (payload.callback_id == 'update_location') {
        return await updateLocation(payload)
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

const getDrupalProfileDialog = async payload => {
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

const updateDrupalProfile = async payload => {
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

const getWPProfileDialog = async payload => {
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

const updateWPProfile = async payload => {
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

const verifyData = async submission => {
  let errors = []

  if (submission.linkedin) {
    const linkedin = url.parse(submission.linkedin)
    const linkedin_valid = (linkedin.host == 'linkedin.com') && (linkedin.pathname.split('/')[1] == 'in')
    if (!linkedin_valid) errors.push({ "name": "linkedin", "error": "This is not a valid LinkedIn URL" })
  }

  if (submission.drupal_profile) {
    const drupal = url.parse(submission.drupal_profile)

    // Apply heuristics.
    const drupal_valid = (drupal.host == 'drupal.org' || drupal.host == 'www.drupal.org') && (drupal.pathname.split('/')[1] == 'u')

    // Capture errors.
    if (!drupal_valid) errors.push({ "name": "drupal_profile", "error": "This is not a valid Drupal URL" })
  }

  return errors
}

const getLocationDialog = async payload => {
  const profile = await profilesRef().doc(payload.user.id).get().then(doc => doc.data()) || {}

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

const updateLocation = async payload => {
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
