const axios = require('axios')
const { profilesRef } = require('../util/firebase')
const api = require('../util/api')()

const defaultBlocks = require('../blocks/defaultHome')
const drupal = require('../blocks/drupal')
const wp = require('../blocks/wp')

const drupal_base_url = 'https://app.drupalcontractors.com/'
const wp_base_url = 'https://wpcontractors.github.io/'

module.exports = async user => {
  const initialOptions = (blocks, profile) => {
    return blocks.reduce((accum, block) => {
      if (block.accessory && profile[block.accessory.action_id] !== undefined) {
        const value = profile[block.accessory.action_id]

        if (value.length > 0 || value.value) {
          if (block.accessory.type == 'static_select') {
            block.accessory.initial_option = block.accessory.options.find(option => option.value == value)
          }
          else if (block.accessory.type == 'datepicker') {
            block.accessory.initial_date = value
          }
          else {
            block.accessory.initial_options = block.accessory.options.filter(option => value.includes(option.value))
          }
        }
      }

      accum.push(block)

      return accum
    }, [])
  }

  // Get values.
  const profile = (await profilesRef().doc(user).get()).data() || {}

  // Get default blocks.
  let blocks = defaultBlocks

  if (profile.cms && profile.cms.length > 0) {
    // Add Drupal button if they're a Drupal developer.
    if (profile.cms.includes('drupal')) blocks = [...blocks, ...drupal.blocks(drupal_base_url, user)]

    // Add WP button if they're a Drupal developer.
    if (profile.cms.includes('wordpress')) blocks = [...blocks, ...wp.blocks(wp_base_url, user)]
  }

  // Display location if found.
  if (profile.location) {
    blocks = blocks.reduce((acc, item) => {
      if (item.block_id == 'location') item.text.text = "*My location:* " + profile.location

      acc.push(item)

      return acc
    }, [])
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
