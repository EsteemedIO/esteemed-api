import { loadUsers, allProfiles, format } from './../util/userProfiles'

export default async handle => {
  try {
    return Promise.all([loadUsers(), allProfiles()])
      .then(([users, profiles]) => {
        const requestedUser = users.find(user => user.name === handle.replace('@', '')) || false

        if (requestedUser) {
          const externalProfile = profiles.find(profile => profile.id === requestedUser.id)
          const text = format(requestedUser.profile, externalProfile)

          if (Object.prototype.hasOwnProperty.call(profiles.find(profile => profile.id === requestedUser.id), 'drupal_profile')) {
            // text += "\n" + "<" + profiles[requestedUser.id].drupal_profile + "|" + profiles[requestedUser.id].drupal_bio + ">"
          }

          if (Object.prototype.hasOwnProperty.call(profiles.find(profile => profile.id === requestedUser.id), 'wp_profile')) {
            // text += "\n" + "<" + profiles[requestedUser.id].wp_profile + "|" + profiles[requestedUser.id].wp_bio + ">"
          }

          return [
            {
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
          ]
        } else {
          return [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Wrong Username'
              }
            }
          ]
        }
      })
      .then(blocks => ({ response_type: 'in_channel', blocks: blocks }))
      .catch(e => console.log(e))
  } catch (e) {
    console.log(e)
  }
}
