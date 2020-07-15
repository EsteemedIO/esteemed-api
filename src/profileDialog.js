const dynamodb = require('./util/dynamodb')
const getProfileHome = require('./event/getProfileHome')
const drupal = require('./blocks/drupal')
const wp = require('./blocks/wp')
const location = require('./blocks/location')
const { addJob, editJobForm, updateJob, addJobNoteForm, updateNotes } = require('./slashCommands/job')

module.exports = async (req, res, next) => {
  try {
    const payload = JSON.parse(req.body.payload)

    if (payload.view && payload.view.type == 'home' && payload.type && payload.type == 'block_actions') {
      // Update Home page options.
      if (payload.actions[0].type == 'multi_static_select'
        || payload.actions[0].type == 'datepicker'
        || payload.actions[0].type == 'static_select') {
        await updateProfileHome(payload)
      }

      // Get Drupal dialog upon button click.
      if (payload.actions[0].block_id == 'drupal_profile') {
        await drupal.dialog(payload)
      }

      // Get WP dialog upon button click.
      if (payload.actions[0].block_id == 'wp_profile') {
        await wp.dialog(payload)
      }

      // Get location lookup dialog upon button click.
      if (payload.actions[0].block_id == 'locality') {
        await location.dialog(payload, res)
      }
    }

    if (payload.type && payload.type == 'block_actions') {
      if (payload.actions[0].action_id == 'edit_job') {
        await editJobForm(payload.trigger_id, payload.actions[0]['value'])
        res.send()
      }
      if (payload.actions[0].action_id == 'add_job_notes') {
        await addJobNoteForm(payload.trigger_id, payload.actions[0]['value'])
      }
    }

    // Update Drupal profile.
    if (payload.type && payload.type == 'dialog_submission') {
      if (payload.callback_id == 'update_drupal_profile') {
        await drupal.updateProfile(payload)
      }

      if (payload.callback_id == 'update_wp_profile') {
        await wp.updateProfile(payload)
      }

      if (payload.callback_id == 'update_location') {
        await location.update(payload)
      }
    }

    if (payload.type && payload.type == 'view_submission') {
      if (payload.view.callback_id == 'add_job') {
        await addJob(payload.view.state.values)
      }
      if (payload.view.callback_id == 'edit_job') {
        await updateJob(payload.view.private_metadata, payload.view.state.values)
      }
      if (payload.view.callback_id == 'add_job_notes') {
        await updateNotes(payload.view.private_metadata, payload.user.id, payload.view.state.values)
      }
    }

    res.send()
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

  await getProfileHome(payload.user.id)

  return {}
}
