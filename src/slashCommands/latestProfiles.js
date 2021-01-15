import { loadUsers, allProfiles, getUser, format } from '../util/userProfiles.js'

export default async userId => {
  try {
    return await Promise.all([loadUsers(), allProfiles()])
      .then(([users, profiles]) => {
        const currentUser = users.find(user => user.id === userId)

        if (!(currentUser.is_admin || currentUser.is_owner)) {
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

        if (users.length === 0) {
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

        const latestProfilesSortedArray = profiles
          .sort((a, b) => { return Number(b.join_date.split('-').join('')) - Number(a.join_date.split('-').join('')) })
          .slice(0, 10)

        return Promise.all(latestProfilesSortedArray.map(item => {
          return getUser(item.id)
            .then(requestedUser => {
              const text = format(requestedUser.profile)

              if (Object.prototype.hasOwnProperty.call(profiles.find(profile => profile.id === requestedUser.id), 'drupal_profile')) {
                // text += "\n" + "<" + profiles[item].drupal_profile + "|" + profiles[item].drupal_bio + ">"
              }

              if (Object.prototype.hasOwnProperty.call(profiles.find(profile => profile.id === requestedUser.id), 'wp_profile')) {
                // text += "\n" + "<" + profiles[item].wp_profile + "|" + profiles[item].wp_bio + ">"
              }

              return {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: text
                },
                accessory: {
                  type: 'image',
                  image_url: requestedUser.profile.image_192,
                  alt_text: requestedUser.profile.real_name
                }
              }
            })
        }))
          .then(blocks => blocks.flatMap((v, i, a) => a.length - 1 !== i ? [v, { type: 'divider' }] : v))
          .then(blocks => ({ response_type: 'in_channel', blocks: blocks }))
          .catch(e => console.log(e))
      })
  } catch (e) {
    console.log(e)
  }
}
