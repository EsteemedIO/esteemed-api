const api = require('../util/api')
const dynamodb = require('../util/dynamodb')

const defaultBlocks = require('../blocks/defaultHome')
const drupal = require('../blocks/drupal')
const wp = require('../blocks/wp')
const slackFormData = require('../util/slackFormData')

module.exports = async user => {
  // Get values.
  const params = {
    TableName: 'profiles',
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
      if (item.block_id === 'locality') item.text.text = '*My location:* ' + profile.locality

      acc.push(item)

      return acc
    }, [])
  }

  // Get initial values for blocks.
  const blocksWithValues = slackFormData.set(blocks, profile)

  // Prepare home view.
  const home = {
    user_id: user,
    callback_id: 'profile_home',
    view: {
      type: 'home',
      blocks: blocksWithValues
    }
  }

  // Update home view.
  return await api.bot().post('views.publish', home)
    .then(() => ({ statusCode: 200, body: '' }))
    .catch((e) => { console.log('dialog.open call failed: %o', e) })
}
