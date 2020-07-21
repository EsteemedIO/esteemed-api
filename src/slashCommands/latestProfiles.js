const profiles = require('../util/userProfiles')

module.exports = async (req, res, next) => {
  try {
    return await Promise.all([profiles.loadUsers(), profiles.allProfiles()])
      .then(([users, allProfiles]) => {
        const currentUser = users.find(user => user.id === req.body.user_id)

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

        const latestProfilesSortedArray = allProfiles
          .sort((a, b) => { return Number(b.join_date.split('-').join('')) - Number(a.join_date.split('-').join('')) })
          .slice(0, 10)

        return Promise.all(latestProfilesSortedArray.map(item => {
          return profiles.getUser(item.id)
            .then(requestedUser => {
              const text = profiles.format(requestedUser.profile)

              if (Object.prototype.hasOwnProperty.call(allProfiles.find(profile => profile.id === requestedUser.id), 'drupal_profile')) {
                // text += "\n" + "<" + allProfiles[item].drupal_profile + "|" + allProfiles[item].drupal_bio + ">"
              }

              if (Object.prototype.hasOwnProperty.call(allProfiles.find(profile => profile.id === requestedUser.id), 'wp_profile')) {
                // text += "\n" + "<" + allProfiles[item].wp_profile + "|" + allProfiles[item].wp_bio + ">"
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
          .then(blocks => res.send({ response_type: 'in_channel', blocks: blocks }))
          .catch(e => console.log(e))
      })
  } catch (e) {
    console.log(e)
    next(e)
  }

  res.send()
}
