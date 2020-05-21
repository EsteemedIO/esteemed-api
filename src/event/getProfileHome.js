const axios = require('axios')
const { profilesRef } = require('../firebase')
const api = require('../api')()

const defaultBlocks = require('../blocks/defaultHome')
const drupalBlocks = require('../blocks/drupal')
const wpBlocks = require('../blocks/wp')

const drupal_base_url = 'https://app.drupalcontractors.com/'
const wp_base_url = 'https://app.wpcontractors.com/'

module.exports = async user => {
  // Get values.
  const profile = await profilesRef().doc(user).get().then(doc => doc.data()) || {}

  // Get default blocks.
  let blocks = defaultBlocks

  if (profile.cms && profile.cms.length > 0) {
    // Add Drupal button if they're a Drupal developer.
    const is_drupal_dev = (profile.cms.filter(cms => cms.value == 'drupal').length === 1)
    if (is_drupal_dev) blocks = [...blocks, ...drupalBlocks(drupal_base_url, user)]

    // Add WP button if they're a Drupal developer.
    const is_wp_dev = (profile.cms.filter(cms => cms.value == 'wordpress').length === 1)
    if (is_wp_dev) blocks = [...blocks, ...wpBlocks(wp_base_url, user)]
  }

  // Get initial values for blocks.
  const blocks_with_values = initialOptions(blocks, profile)

  // Prepare home view.
  const home = {
    token: process.env.SLACK_TOKEN_BOT,
    user_id: user,
    callback_id: 'profile_home',
    view: {
      "type": "home",
      "blocks": blocks_with_values
    }
  }

  // Update home view.
  return await axios.post('https://slack.com/api/views.publish', home, { headers: {
    'Authorization': 'Bearer ' + process.env.SLACK_TOKEN_BOT,
    'Content-Type': 'application/json',
    }})
    .then(data => {
      //console.log('response: ', data.data)
      return { statusCode: 200, body: '' }
    })
    .catch((e) => { console.log('dialog.open call failed: %o', e) })
}

const initialOptions = (blocks, profile) => {
  return blocks.reduce((accum, block) => {
    if (block.accessory && profile[block.accessory.action_id] !== undefined) {
      const initial_option = profile[block.accessory.action_id]

      if (initial_option.length > 0 || initial_option.value) {
        if (block.accessory.type == 'static_select') {
          block.accessory.initial_option = initial_option
        }
        else if (block.accessory.type == 'datepicker') {
          block.accessory.initial_date = initial_option
        }
        else {
          block.accessory.initial_options = initial_option
        }
      }
    }

    accum.push(block)

    return accum
  }, [])
}
