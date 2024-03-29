import { loadUser, allProfiles, getUser, format } from '../util/userProfiles.js'

export default async userId => {
  try {
    return await Promise.all([loadUser(userId), allProfiles(10)])
      .then(([currentUser, profiles]) => {
        if (!(currentUser.user.is_admin || currentUser.user.is_owner)) {
          return [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Only admins or owners can use this command'
              }
            }
          ]
        }

        if (profiles.length === 0) {
          return [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'No profiles available.'
              }
            }
          ]
        }

        return Promise.all(profiles.map(async item => {
          let response = {
            type: 'section',
            text: {
              type: 'mrkdwn'
            }
          }

          if (item.slackId) {
            const requestedUser = await getUser(item.slackId)
            response.text.text = format(requestedUser.profile, item)
            response.accessory = {
              type: 'image',
              image_url: requestedUser.profile.image_192,
              alt_text: requestedUser.profile.real_name
            }
          }
          else {
            response.text.text = format(null, item)
          }

          return response
        }))
          .then(blocks => blocks.flatMap((v, i, a) => a.length - 1 !== i ? [v, { type: 'divider' }] : v))
          .then(blocks => ({ response_type: 'in_channel', blocks: blocks }))
          .catch(e => console.log(e))
      })
  } catch (e) {
    console.log(e)
  }
}
