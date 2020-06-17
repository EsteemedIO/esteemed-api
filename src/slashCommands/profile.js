const qs = require('query-string')
const axios = require('axios')
const profiles = require('./../util/userProfiles')

exports.handler = async event => {
  const payload = qs.parse(event.body)

  delayResponse(payload)

  return { statusCode: 200, body: "Loading user info..." }
}

const delayResponse = async payload => {
  try {

    const currentUser = await profiles.loadUsers()
      .then(users => users.find(user => user.id == payload.user_id))

    var msg = {
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Wrong Username"
          }
        }
      ]
    }

    if (currentUser.is_admin || currentUser.is_owner) {
      const usersPromise = profiles.loadUsers()
      const profilesPromise = profiles.allProfiles()
      const users = await usersPromise
      const allProfiles = await profilesPromise

      const requestedUser = users.find(user => user.name == payload.text.replace('@', '')) || false

      if (requestedUser) {
        let text = profiles.format(requestedUser.profile)

        if (allProfiles[requestedUser.id].hasOwnProperty('drupal_profile') ) {
          // text += "\n" + "<" + allProfiles[requestedUser.id].drupal_profile + "|" + allProfiles[requestedUser.id].drupal_bio + ">"
        }

        if (allProfiles[requestedUser.id].hasOwnProperty('wp_profile') ) {
          // text += "\n" + "<" + allProfiles[requestedUser.id].wp_profile + "|" + allProfiles[requestedUser.id].wp_bio + ">"
        }

        msg = {
          "blocks": [
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
      }
    } else {
      msg.blocks = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Only admin or owner can use this command"
          }
        }
      ]
    }

    axios({
      method: 'post',
      url: 'https://slack.com/api/chat.postMessage',
      headers: { 'Content-Type': 'application/json' },
      params: { channel: payload.channel_id, token: process.env.SLACK_TOKEN, parse: 'full', blocks: JSON.stringify(msg.blocks) }
    })

    return

  } catch (e) {
    console.log(e)

    return { statusCode: 400, body: JSON.stringify(e) }
  }
}

