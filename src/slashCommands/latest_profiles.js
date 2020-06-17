const qs = require('query-string')
const axios = require('axios')
const profiles = require('./../util/userProfiles')

exports.handler = async event => {
  const payload = qs.parse(event.body)

  delayResponse(payload)

  return { statusCode: 200, body: "Loading 10 most current profiles..." }

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
            "text": "Nothing to display"
          }
        }
      ]
    }

    if (currentUser.is_admin || currentUser.is_owner) {
      const allProfiles = await profiles.allProfiles()
      const allProfilesKeys = Object.keys(allProfiles)
      const allProfilesArray = allProfilesKeys.reduce((acc, key) => { 
        acc.push({...allProfiles[key], ...{id: key}})
        return acc 
      }, [])
      const latestProfilesKeys = allProfilesArray.sort((a, b) => { return b.join_date - a.join_date })
        .reduce((acc, value) => {
          acc.push(value.id)
          return acc
        }, [])
      // allProfilesArray.sort((a, b) => { return b.join_date - a.join_date }).reduce((acc, value) => { console.log(value) })
      // const latestProfilesKeys = []
      // allProfilesArray.sort((a, b) => { return b.join_date - a.join_date }).slice(0, 10)
      // .forEach((key, value) => {
      //   latestProfilesKeys.push(key)
      // });
      // console.log(latestProfilesKeys)

      msg.blocks = await Promise.all(latestProfilesKeys.map(async (item) => {
        try {
          return profiles.getUser(item)
            .then(requestedUser => {

              if (requestedUser.ok) {
                let text = profiles.format(requestedUser.user.profile)

                if (allProfiles[item].hasOwnProperty('drupal_profile')) {
                  // text += "\n" + "<" + allProfiles[item].drupal_profile + "|" + allProfiles[item].drupal_bio + ">"
                }

                if (allProfiles[item].hasOwnProperty('wp_profile')) {
                  // text += "\n" + "<" + allProfiles[item].wp_profile + "|" + allProfiles[item].wp_bio + ">"
                }

                return {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": text
                  },
                  "accessory": {
                    "type": "image",
                    "image_url": requestedUser.user.profile.image_48,
                    "alt_text": requestedUser.user.profile.real_name
                  }
                }

                //acc.push()
              }
            })
        } catch (err) { throw err }
      }))
      .then(blocks => blocks.flatMap((v, i, a) => a.length - 1 !== i ? [v, { "type": "divider" }] : v))
    }
    else {
      msg.blocks = {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Only admins or owners can use this command"
        }
      }
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
