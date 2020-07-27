const profiles = require('./../util/userProfiles')

module.exports = async handle => {
  try {
    return Promise.all([profiles.loadUsers(), profiles.allProfiles()])
      .then(([users, allProfiles]) => {
        const requestedUser = users.find(user => user.name === handle.replace('@', '')) || false

        if (requestedUser) {
          const externalProfile = allProfiles.find(profile => profile.id === requestedUser.id)
          const text = profiles.format(requestedUser.profile, externalProfile)

          if (Object.prototype.hasOwnProperty.call(allProfiles.find(profile => profile.id === requestedUser.id), 'drupal_profile')) {
            // text += "\n" + "<" + allProfiles[requestedUser.id].drupal_profile + "|" + allProfiles[requestedUser.id].drupal_bio + ">"
          }

          if (Object.prototype.hasOwnProperty.call(allProfiles.find(profile => profile.id === requestedUser.id), 'wp_profile')) {
            // text += "\n" + "<" + allProfiles[requestedUser.id].wp_profile + "|" + allProfiles[requestedUser.id].wp_bio + ">"
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
