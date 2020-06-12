const qs = require('query-string')
const axios = require('axios')
const api = require('./../util/api')()
const { profilesRef } = require('./../util/firebase')

exports.handler = async event => {
  const payload = qs.parse(event.body)

  delayResponse(payload)

  return {statusCode: 200, body: "Collecting info..."}

}

const loadUsers = () => {
  return api.get('users.list')
    .then(({ data }) => data.members.filter(member => !member.is_bot))
    //.then(data => data.filter(member => !member.is_admin))
    .then(data => data.filter(member => !member.deleted))
    .then(data => data.filter(member => member.id != 'USLACKBOT'))
}

const loadChannelMembers = channel => {
  return api.get('conversations.members', {
      params: {
        channel: channel
      }
    })
    .then(({ data }) => data.members)
}

const allProfiles = () => {
  return profilesRef().get()
    .then(snapshot => snapshot.docs.reduce((obj, item) => {
      obj[item.id] = item.data()
      return obj
    }, {}))
    .catch(e => { console.log('Error getting documents', e) })
}

const getUser = userId => {
  return api.get('users.info', {
    params: {
      user: userId
    }
  }).then( ({data}) => data )
}

const delayResponse = async payload => {
  try {

    const usersPromise = loadUsers()
    const profilesPromise = allProfiles()
    const users = await usersPromise
    const profiles = await profilesPromise
    const currentUser = users.find( user => user.id == payload.user_id )
    const latestProfilesKeys = Object.keys(profiles).slice(0, 10)
    var msg = {
      "blocks": [
                  
      ]
    }

    if ( currentUser.is_admin || currentUser.is_owner ) {

      for ( const latestProfileKey of latestProfilesKeys ) {

        const requestedUser = await getUser(latestProfileKey)

        if ( requestedUser.ok ) {

          var txt = "Name: " + requestedUser.user.profile.real_name + "\nEmail: " + requestedUser.user.profile.email + "\nPhone: " + requestedUser.user.profile.phone + "\nTitle: " + requestedUser.user.profile.title
        
          if ( profiles[latestProfileKey].hasOwnProperty('drupal_profile') ) {

            // txt += "\n" + "<" + profiles[latestProfileKey].drupal_profile + "|" + profiles[latestProfileKey].drupal_bio + ">"

          }

          if ( profiles[latestProfileKey].hasOwnProperty('wp_profile') ) {

            // txt += "\n" + "<" + profiles[latestProfileKey].wp_profile + "|" + profiles[latestProfileKey].wp_bio + ">"

          }

          msg.blocks.push({
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": txt
            },
            "accessory": {
              "type": "image",
              "image_url": requestedUser.user.profile.image_48,
              "alt_text": requestedUser.user.profile.real_name
            }
          })

          msg.blocks.push({
            "type": "divider"
          })
        }

      }

      axios.post(process.env.SLACK_SLASH_COMMAND_HOOK, msg, { headers: {'Content-Type': 'application/json'}})

      return


    } else {

      var errMsg = {
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Only admin or owner can use this command"
            }
          }
        ]
      }

      axios.post(process.env.SLACK_SLASH_COMMAND_HOOK, errMsg, { headers: {'Content-Type': 'application/json'}})

      return

    }

    var errMsg = {
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

    axios.post(process.env.SLACK_SLASH_COMMAND_HOOK, errMsg, { headers: {'Content-Type': 'application/json'}})

    return


  } catch (e) {
    console.log(e)

    return { statusCode: 400, body: JSON.stringify(e) }
  }
}