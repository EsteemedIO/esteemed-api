const dynamodb = require('../util/dynamodb')

const defaultBlocks = require('../blocks/defaultHome')
const drupal = require('../blocks/drupal')
const wp = require('../blocks/wp')
const slackFormData = require('../util/slackFormData')

module.exports.get = async user => {
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
  return {
    type: 'home',
    blocks: blocksWithValues
  }
}

module.exports.update = async (user, action) => {
  let values = []

  switch (action.type) {
    case 'static_select':
      values = action.selected_option.value
      break
    case 'multi_static_select':
      values = action.selected_options.map(option => option.value)
      break
    case 'datepicker':
      values = action.selected_date
      break
  }

  // Update profile data.
  const params = {
    TableName: 'profiles',
    Key: {
      id: user
    },
    UpdateExpression: 'set ' + action.action_id + ' = :v',
    ExpressionAttributeValues: {
      ':v': values
    }
  }

  await dynamodb.update(params).promise()
    .then(res => console.log(res))
    .catch(e => console.log(e))

  await module.exports.get(user)
}
