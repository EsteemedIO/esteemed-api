const qs = require('query-string')
const axios = require('axios')
const profiles = require('./../util/userProfiles')

module.exports = async (req, res, next) => {
  try {
    await Promise.all([ profiles.loadUsers(), profiles.allProfiles() ])
      .then(([users, allProfiles]) => {
        const currentUser = users.find(user => user.id == req.body.user_id)

        if (!(currentUser.is_admin || currentUser.is_owner)) {
          return [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "Only admin or owner can use this command"
              }
            }
          ]
        }

        const requestedUser = users.find(user => user.name == req.body.text.replace('@', '')) || false

        if (requestedUser) {
          let text = profiles.format(requestedUser.profile)

          if (allProfiles.find(profile => profile.id == requestedUser.id).hasOwnProperty('drupal_profile')) {
            // text += "\n" + "<" + allProfiles[requestedUser.id].drupal_profile + "|" + allProfiles[requestedUser.id].drupal_bio + ">"
          }

          if (allProfiles.find(profile => profile.id == requestedUser.id).hasOwnProperty('wp_profile')) {
            // text += "\n" + "<" + allProfiles[requestedUser.id].wp_profile + "|" + allProfiles[requestedUser.id].wp_bio + ">"
          }

          return [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": text
              },
              "accessory": {
                "type": "image",
                "image_url": requestedUser.profile.image_48,
                "alt_text": requestedUser.profile.real_name
              }
            }
          ]
        }
        else {
          return [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "Wrong Username"
              }
            }
          ]
        }
      })
      .then(blocks => res.send({ response_type: 'in_channel', blocks: blocks }))
      .catch(e => console.log(e))
  } catch (e) {
    console.log(e)
    next(e)
  }

  res.send()
}
