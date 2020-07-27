const dynamodb = require('../util/dynamodb')
const verifyData = require('../util/verifyData')

module.exports.blocks = () => {
  return [
    {
      type: 'section',
      block_id: 'drupal_profile',
      text: {
        type: 'mrkdwn',
        text: 'Click the button to the right to edit your Drupal profile'
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Edit Drupal Profile'
        },
        value: 'drupal_profile'
      }
    }
  ]
}

module.exports.modal = async user => {
  const params = {
    TableName: 'profiles',
    Key: {
      id: user
    }
  }
  const profile = (await dynamodb.get(params).promise().then(({ Item }) => Item) || {})

  return {
    title: {
      type: 'plain_text',
      text: 'Update my Drupal profile'
    },
    callback_id: 'update_drupal_profile',
    submit: {
      type: 'plain_text',
      text: 'Save'
    },
    close: {
      type: 'plain_text',
      text: 'Cancel'
    },
    type: 'modal',
    blocks: [{
      type: 'input',
      block_id: 'drupal_profile',
      element: {
        type: 'plain_text_input',
        action_id: 'val',
        initial_value: profile.drupal_profile || '',
        placeholder: {
          type: 'plain_text',
          text: 'https://www.drupal.org/u/'
        }
      },
      label: {
        type: 'plain_text',
        text: 'Drupal.org Profile link'
      }
    }, {
      type: 'input',
      block_id: 'drupal_bio',
      element: {
        type: 'plain_text_input',
        multiline: true,
        action_id: 'val',
        initial_value: profile.drupal_bio || '',
        placeholder: {
          type: 'plain_text',
          text: "I'm awesome at Drupal because..."
        }
      },
      label: {
        type: 'plain_text',
        text: 'Drupal Bio'
      }
    }]
  }
}

module.exports.updateProfile = async (user, values) => {
  try {
    // Check for valid data.
    const errors = await verifyData(values)

    // TODO Fix error return
    if (errors.length > 0) return { statusCode: 200, body: JSON.stringify({ errors: errors }) }

    // Normalize URL if users enter www subdomain.
    const drupalProfile = 'https://drupal.org' + new URL(values.drupal_profile.val.value).pathname

    // Update profile data.
    const params = {
      TableName: 'profiles',
      Key: {
        id: user
      },
      UpdateExpression: 'set drupal_profile = :drupal_profile, drupal_bio = :drupal_bio',
      ExpressionAttributeValues: {
        ':drupal_profile': drupalProfile,
        ':drupal_bio': values.drupal_bio.val.value
      }
    }

    await dynamodb.update(params).promise()
      .then(res => console.log(res))
      .catch(e => console.log(e))
  } catch (error) {
    console.error(error)
  }
}
