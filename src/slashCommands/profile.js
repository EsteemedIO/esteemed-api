import { loadUser, getProfile, format } from './../util/userProfiles'

export default async handle => {
  try {
    return Promise.all([loadUser(handle), getProfile(handle)])
      .then(([user, profile]) => {
        if (user) {
          const text = format(user.profile, profile)

          if (Object.prototype.hasOwnProperty.call(profile, 'drupal_profile')) {
            // text += "\n" + "<" + profile.drupal_profile + "|" + profile.drupal_bio + ">"
          }

          if (Object.prototype.hasOwnProperty.call(profile, 'wp_profile')) {
            // text += "\n" + "<" + profile.wp_profile + "|" + profile.wp_bio + ">"
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
                image_url: user.profile.image_192,
                alt_text: user.profile.real_name
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
