const qs = require('query-string')
const axios = require('axios')
const profiles = require('./../util/userProfiles')

exports.handler = async event => {
  const payload = qs.parse(event.body)

  try {
    await Promise.all([ profiles.loadUsers(), profiles.allProfiles() ])
      .then(([users, allProfiles]) => {
        const currentUser = users.find(user => user.id == payload.user_id)

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

        const requestedUser = users.find(user => user.name == payload.text.replace('@', '')) || false

        if (requestedUser) {
          let text = profiles.format(requestedUser.profile)

          if (allProfiles[requestedUser.id].hasOwnProperty('drupal_profile') ) {
            // text += "\n" + "<" + allProfiles[requestedUser.id].drupal_profile + "|" + allProfiles[requestedUser.id].drupal_bio + ">"
          }

          if (allProfiles[requestedUser.id].hasOwnProperty('wp_profile') ) {
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
      .then(blocks => axios.post('https://slack.com/api/chat.postMessage', null, {
          headers: { 'Content-Type': 'application/json' },
          params: { channel: payload.channel_id, token: process.env.SLACK_TOKEN, parse: 'full', blocks: JSON.stringify(blocks) }
        }))
      .catch(e => console.log(e))
  } catch (e) {
    console.log(e)

    return { statusCode: 400, body: JSON.stringify(e) }
  }

  return { statusCode: 200, body: "" }
}
