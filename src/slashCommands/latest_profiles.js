const qs = require('query-string')
const axios = require('axios')
const profiles = require('./../util/userProfiles')

exports.handler = async event => {
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!');
    return 'Lambda is warm!';
  }

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
                "text": "Only admins or owners can use this command"
              }
            }
          ]
        }

        if (users.length == 0) {
          return [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "No profiles available."
              }
            }
          ]
        }

        const allProfilesArray = Object.keys(allProfiles).reduce((acc, key) => {
          acc.push({...allProfiles[key], ...{id: key}})
          return acc
        }, [])

        const latestProfilesKeys = allProfilesArray
          .sort((a, b) => { return Number(b.join_date.split("-").join("")) - Number(a.join_date.split("-").join("")) })
          .map(value => value.id)
          .slice(0, 10)

        return Promise.all(latestProfilesKeys.map(async item => {
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
                }
              })
            } catch (err) { throw err }
          }))
          .then(blocks => blocks.flatMap((v, i, a) => a.length - 1 !== i ? [v, { "type": "divider" }] : v))
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
