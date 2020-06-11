const api = require('./util/api')()
const { profilesRef } = require('./util/firebase')

exports.handler = async event => {
  try {
    const allowedChannels = process.env.SLACK_CHANNELS.split(',')
    const channel = event.queryStringParameters ? event.queryStringParameters.channel : false

    // Require channel argument.
    if (!channel) return { statusCode: 400, body: 'Channel argument required' }

    // Disallow sneaking into unapproved channels.
    if (!allowedChannels.includes(channel)) return { statusCode: 400, body: 'Invalid channel' }

    const usersPromise = loadUsers()
    const profilesPromise = allProfiles()
    const users = await usersPromise
    const profiles = await profilesPromise

    // Iterate the conversation.members call due to its pagination limit.
    let members = []
    let more_members = true
    let cursor = ''

    while (more_members) {
      let members_paged = await loadChannelMembers(channel, cursor)
      more_members = members_paged.more
      cursor = members_paged.cursor
      members = members.concat(members_paged.members)
    }

    const body = members
      .map(data => users.find(user => data.includes(user.id)))
      .map(user => {
        const name = user.real_name.split(' ')
        const first = name[0]
        const last = name[1] ? ' ' + name[1][0] + '.' : ''

        let profile = {
          id: user.id,
          name: first + last,
          image: user.profile.image_512,
        }

        const fb_profile = profiles[user.id]

        if (fb_profile) {
          profile = { ...profile, ...{
            'location': fb_profile.location ? fb_profile.location : '',
            'availability': fb_profile.availability ? fb_profile.availability : '',
            'english': fb_profile.english ? fb_profile.english : '',
            'titles': fb_profile.titles ? fb_profile.titles : [],
            'languages': fb_profile.languages ? fb_profile.languages : [],
            'skills': fb_profile.skills ? fb_profile.skills : [],
            'citizenship': fb_profile.citizen ? fb_profile.citizen : '',
            'drupal_bio': profiles[user.id] ? profiles[user.id].drupal_bio : '',
            'wp_experience': profiles[user.id] ? profiles[user.id].wp_experience : '',
            'wp_bio': profiles[user.id] ? profiles[user.id].wp_bio : '',
          }}
        }

        return profile
      })

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(body),
    }
  } catch (e) {
    console.log(e)

    return { statusCode: 400, body: JSON.stringify(e) }
  }
}

const loadUsers = () => {
  return api.get('users.list')
    .then(({ data }) => data.members.filter(member => !member.is_bot))
    //.then(data => data.filter(member => !member.is_admin))
    .then(data => data.filter(member => !member.deleted))
    .then(data => data.filter(member => member.id != 'USLACKBOT'))
}

const loadChannelMembers = (channel, cursor) => {
  let params = {
    channel: channel,
    limit: 1000,
  }

  if (cursor != '') {
    params.cursor = cursor
  }

  return api.get('conversations.members', { params: params })
    .then(({ data }) => ({
        members: data.members,
        cursor: data.response_metadata.next_cursor,
        more: (data.response_metadata.next_cursor != '')
      }))
}

const allProfiles = () => {
  return profilesRef().get()
    .then(snapshot => snapshot.docs.reduce((obj, item) => {
      obj[item.id] = item.data()
      return obj
    }, {}))
    .catch(e => { console.log('Error getting documents', e) })
}
