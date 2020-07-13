const axios = require('axios')
const dynamodb = require('../util/dynamodb')

const defaultBlocks = require('../blocks/defaultHome')
const drupal = require('../blocks/drupal')
const wp = require('../blocks/wp')
const flattenSlack = require('../util/flattenSlack')

module.exports = async user => {

  // Get values.
  let params = {
    TableName: "profiles",
    Key: {
      id: user
    }
  }
  const profile = (await dynamodb.get(params).promise().then(({ Item }) => Item) || {})

  // Get default blocks.
  let blocks = defaultBlocks

  if (profile.cms && profile.cms.length > 0) {
    // Add Drupal button if they're a Drupal developer.
    if (profile.cms.includes('drupal')) blocks = [...blocks, ...drupal.blocks()]

    // Add WP button if they're a Drupal developer.
    if (profile.cms.includes('wordpress')) blocks = [...blocks, ...wp.blocks()]
  }

  // Display location if found.
  if (profile.locality) {
    blocks = blocks.reduce((acc, item) => {
      if (item.block_id == 'locality') item.text.text = "*My location:* " + profile.locality

      acc.push(item)

      return acc
    }, [])
  }

  // Get initial values for blocks.
  const blocks_with_values = flattenSlack.unflatten(blocks, profile)

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
    .then(() => ({ statusCode: 200, body: '' }))
    .catch((e) => { console.log('dialog.open call failed: %o', e) })
}
