const api = require('./api')
const dynamodb = require('../util/dynamodb')
const keyValue = require('../util/keyValue')

module.exports.loadUsers = () => {
  return api.user().get('users.list')
    .then(({ data }) => data.members.filter(member => !member.is_bot))
    // .then(data => data.filter(member => !member.is_admin))
    .then(data => data.filter(member => !member.deleted))
    .then(data => data.filter(member => member.id !== 'USLACKBOT'))
}

module.exports.loadChannelMembers = (channel, cursor) => {
  const params = {
    channel: channel,
    limit: 1000
  }

  if (cursor !== '') {
    params.cursor = cursor
  }

  return api.user().get('conversations.members', { params: params })
    .then(({ data }) => ({
      members: data.members,
      cursor: data.response_metadata.next_cursor,
      more: (data.response_metadata.next_cursor !== '')
    }))
}

module.exports.allProfiles = async () => {
  var params = {
    TableName: 'profiles'
  }

  return await dynamodb.scan(params).promise().then(({ Items }) => Items)
}

module.exports.getUser = userId => {
  return api.user().get('users.info', { params: { user: userId } })
    .then(({ data }) => data.user)
    .catch(err => console.log(err))
}

module.exports.format = (profile, externalProfile) => {
  let text = `*Name:* ${profile.real_name}
*Title:* ${profile.title}
*Email:* ${profile.email}
*Phone:* ${profile.phone}`

  if (externalProfile) {
    const location = externalProfile.locality || ''
    const titles = externalProfile.titles ? externalProfile.titles.map(title => keyValue[title]).join(', ') : ''
    const languages = externalProfile.languages ? externalProfile.languages.map(language => keyValue[language]).join(', ') : ''
    const cms = externalProfile.cms ? externalProfile.cms.map(cms => keyValue[cms]).join(', ') : ''

    text += `\n
*Join Date:* ${externalProfile.join_date}
*Location:* ${location}
*Abilities:* ${titles}
*Languages:* ${languages}
*CMS Experience:* ${cms}`
  }

  return text
}

module.exports.isAdmin = userId => module.exports.getUser(userId).then(user => user.is_admin)
