const { profilesRef } = require('../firebase')
const api = require('../api')()

const defaultBlocks = require('../blocks/defaultHome')
const drupalBlocks = require('../blocks/drupal')
const wpBlocks = require('../blocks/wp')

module.exports = async user => {
  // Get values.
  const profile = await profilesRef().doc(user).get().then(doc => doc.data()) || {}

  // Get default blocks.
  let blocks = defaultBlocks

  // Add Drupal button if they're a Drupal developer.
  const is_drupal_dev = (profile.cms.filter(cms => cms.value == 'drupal').length === 1)
  if (is_drupal_dev) blocks = [...blocks, ...drupalBlocks]

  // Add WP button if they're a Drupal developer.
  const is_wp_dev = (profile.cms.filter(cms => cms.value == 'wordpress').length === 1)
  if (is_wp_dev) blocks = [...blocks, ...wpBlocks]

  // Get initial values for blocks.
  const blocks_with_values = {
    ...initialOptions(blocks, profile)
  }

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
  return await api.post('views.publish', null, { params: home })
    .then(data => {
//      console.log('response: ', data)
      return { statusCode: 200, body: '' }
    })
    .catch((e) => { console.log('dialog.open call failed: %o', e) })
}

const initialOptions = (blocks, profile) => {
  return blocks.reduce((accum, block) => {
    if (block.accessory && profile[block.accessory.action_id] !== undefined) {
      block.accessory.initial_options = profile[block.accessory.action_id]
    }
    accum.push(block)
    return accum
  }, [])
}
