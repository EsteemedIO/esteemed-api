import { blocks as drupalBlocks } from '../blocks/drupal.js'
import { blocks as wpBlocks } from '../blocks/wp.js'
import { listJobs } from '../slashCommands/job.js'
import { getProfile } from '../util/userProfiles.js'
import { userTaskBlocks } from '../util/tasks.js'

export const blocks = [
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "Esteemed is a community for digital professionals built on Slack. We are focused together on making work-life more abundant, flexible and fun. Members seeking work can apply to join our *Talent Network*, which operates brands that connect pre-screened hard-to-hire engineers with employers in need."
    }
  },
  {
    "type": "actions",
    "elements": [
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Edit Profile"
        },
        "action_id": "edit_profile"
      },
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Update Location"
        },
        "action_id": "locality"
      },
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Help"
        },
        "url": "slack://channel?team=TKBQX7BTL&id=C01AQE5L3KQ"
      },
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Feedback"
        },
        "url": "slack://channel?team=TKBQX7BTL&id=C01AU3MLFSR"
      }
    ]
  }
]

export async function view(userId) {
  try {
    let homeBlocks = blocks;
    const profile = await getProfile(userId)

    // Add buttons for each property.
    if (profile && profile.cms && profile.cms.includes('drupal')) homeBlocks = [...homeBlocks, ...drupalBlocks]
    if (profile && profile.cms && profile.cms.includes('wordpress')) homeBlocks = [...homeBlocks, ...wpBlocks]

    // Add job board.
    const allJobs = await listJobs(userId)
    homeBlocks = [
      ...homeBlocks,
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "\n\n *Job alerts*"
        }
      },
      ...allJobs.blocks
    ]

    // Add user tasks.
    homeBlocks = [
      ...homeBlocks,
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "\n\n *To Do*"
        }
      },
      ...await userTaskBlocks(userId)
    ]

    return homeBlocks
  } catch (error) {
    console.error(error)
  }
}
