import { profiles } from '../models/profiles.js'

export const getTasks = [
  {
    id: 'esteemed_profile',
    cms: 'all',
    task: 'Complete Your Esteemed Contractor Profile (see above)'
  },
  {
    id: 'slack_profile',
    cms: 'all',
    task: 'Complete Your <https://esteemed.slack.com/team/U012M8Z36FM|Slack Profile>'
  },
  {
    id: 'introduction',
    cms: 'all',
    task: 'Introduce Yourself in #general'
  },
  {
    id: 'linkedin_profile',
    cms: 'all',
    task: 'Update Your Profile on LinkedIn to be a Contractor by Esteemed'
  },
  {
    id: 'social_media',
    cms: 'all',
    task: 'Follow Esteemed on Social Media'
  },
  {
    id: 'like_social_posts',
    cms: 'all',
    task: 'Like, comment, or share at least 5 of our social posts'
  },
  {
    id: 'partner',
    cms: 'all',
    task: 'Got a project you could use an extra hand on? Request to be added to our #internal_partners channel'
  },
  {
    id: 'read_blog',
    cms: 'all',
    task: 'To learn more about our mission, check out our <https://esteemed.io/blog/|blog>'
  },
  {
    id: 'read_newsletter',
    cms: 'all',
    task: 'Make sure to check your inbox for weekly updates and developer tips'
  },
  {
    id: 'drupal_blog',
    cms: 'all',
    task: 'Know a thing or two about Drupal, WP or other tech we focus on (CMS, CRM, JavaScript and Cloud), or remote work topics? Got something to share? Contact <https://esteemed.slack.com/archives/D013K279938|@Matthew Ellis Pritchard> to get started writing blogs for our different web properties. We pay!'
  },
  {
    id: 'drupal_channel',
    cms: 'drupal',
    task: 'Join our #drupal channel to discuss all things Drupal'
  },
  {
    id: 'wp_channel',
    cms: 'wordpress',
    task: 'Join our #wordpress channel to discuss all things WordPress'
  },
]

export async function filterUserTasks(profile) {
  return getTasks.filter(task => (task.cms == 'all'
      || (profile.cms.includes('drupal') && task.cms == 'drupal')
      || (profile.cms.includes('wordpress') && task.cms == 'wordpress')
    ))
}

export async function getUserTasks(userId) {
  const profile = await profiles.get(userId)

  return getTasks.map(item => {
    let completed = false
    if (profile.tasks) {
      let userTaskValue = JSON.parse(profile.tasks).find(task => task.id === item.id)
      completed = userTaskValue && userTaskValue.completed ? true : false
    }

    return {
      id: item.id,
      task: item.task,
      completed: completed
    }
  })
}

export async function updateUserTasks(userId, task) {
  const tasks = await getUserTasks(userId)
    .then(tasks => tasks.map(item => {
      item.completed = item.id === task ? true : item.completed
      return item
    }))

  await profiles.update(userId, { tasks: JSON.stringify(tasks) })
}

export async function userTaskBlocks(userId) {
  return getUserTasks(userId)
    .then(items => items.map(item => {
      let output = {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: item.task
        },
      }

      if (!item.completed) {
        output.accessory = {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Completed?'
          },
          action_id: 'complete_task',
          value: item.id
        }
      }
      else {
        output = {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':white_check_mark: ' + item.task,
          },
        }
      }

      return output
    })
    .flatMap((v, i, a) => a.length - 1 !== i ? [v, { type: 'divider' }] : v)
  )
  //.flat()
}
