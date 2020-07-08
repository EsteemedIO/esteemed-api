const dynamodb = require('./util/dynamodb')
const getProfileHome = require('./event/getProfileHome')
const drupal = require('./blocks/drupal')
const wp = require('./blocks/wp')
const location = require('./blocks/location')
const travisBuild = require('./util/travis')

module.exports = async (req, res, next) => {
  try {
    const payload = JSON.parse(req.body.payload)

    if (payload.view && payload.view.type == 'home' && payload.type && payload.type == 'block_actions') {
      // Update Home page options.
      if (payload.actions[0].type == 'multi_static_select'
        || payload.actions[0].type == 'datepicker'
        || payload.actions[0].type == 'static_select') {
        res.send(updateProfileHome(payload))
      }

      // Get Drupal dialog upon button click.
      if (payload.actions[0].block_id == 'drupal_profile') {
        res.send(drupal.dialog(payload))
      }

      // Get WP dialog upon button click.
      if (payload.actions[0].block_id == 'wp_profile') {
        res.send(wp.dialog(payload))
      }

      // Get location lookup dialog upon button click.
      if (payload.actions[0].block_id == 'locality') {
        await location.dialog(payload, res)
      }
    }

    // Update Drupal profile.
    if (payload.type && payload.type == 'dialog_submission') {
      if (payload.callback_id == 'update_drupal_profile') {
        res.send(drupal.updateProfile(payload))
      }

      if (payload.callback_id == 'update_wp_profile') {
        res.send(wp.updateProfile(payload))
      }

      if (payload.callback_id == 'update_location') {
        res.send(location.update(payload))
      }
    }
  } catch (e) {
    next(e)
  }
}

const updateProfileHome = async payload => {
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


  // Update profile data.
  let params = {
    TableName: "profiles",
    Key: {
      id: payload.user.id
    },
    UpdateExpression: "set " + action_id + " = :v",
    ExpressionAttributeValues: {
      ':v': values
    }
  }

  await dynamodb.update(params).promise()
    .then(res => console.log(res))
    .catch(e => console.log(e))

  travisBuild()

  await getProfileHome(payload.user.id)

  return {}
}
