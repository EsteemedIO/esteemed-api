import { profiles } from '../models/profiles.js'
import keyValue from '../util/keyValue.js'

export const blocks = [
  {
    type: 'section',
    block_id: 'wp_profile',
    text: {
      type: 'mrkdwn',
      text: 'Click the button to the right to edit your WP profile'
    },
    accessory: {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Edit WP Profile'
      },
      value: 'wp_profile'
    }
  }
]

export async function modal(user) {
  const profile = await profiles.get(user)

  const modal = {
    title: {
      type: 'plain_text',
      text: 'Update my WP profile'
    },
    callback_id: 'update_wp_profile',
    submit: {
      type: 'plain_text',
      text: 'Save'
    },
    close: {
      type: 'plain_text',
      text: 'Cancel'
    },
    type: 'modal',
    blocks: [
      {
        type: 'input',
        block_id: 'wp_experience',
        label: {
          type: 'plain_text',
          text: 'Experience Level'
        },
        element: {
          type: 'static_select',
          action_id: 'val',
          placeholder: {
            type: 'plain_text',
            text: 'Choose your experience level...'
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: keyValue.entry
              },
              value: 'entry'
            },
            {
              text: {
                type: 'plain_text',
                text: keyValue.intermediate
              },
              value: 'intermediate'
            },
            {
              text: {
                type: 'plain_text',
                text: keyValue.expert
              },
              value: 'expert'
            }
          ]
        }
      },
      {
        type: 'input',
        block_id: 'wp_bio',
        label: {
          type: 'plain_text',
          text: 'WP Bio'
        },
        element: {
          type: 'plain_text_input',
          action_id: 'val',
          multiline: true,
          placeholder: {
            type: 'plain_text',
            text: "I'm awesome at WordPress because..."
          },
          initial_value: profile.wp_bio || ''
        }
      }
    ]
  }

  if (profile.wp_experience) {
    modal.blocks[0].element.initial_option = {
      text: {
        type: 'plain_text',
        text: keyValue[profile.wp_experience]
      },
      value: profile.wp_experience
    }
  }

  return modal
}

export async function updateProfile(user, values) {
  // Update profile data.
  await profiles.update(user,
    {
      wp_experience: values.wp_experience.val.selected_option.value,
      wp_bio: values.wp_bio.val.value
    }
  )
}
