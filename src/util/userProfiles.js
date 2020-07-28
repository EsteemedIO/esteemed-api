const { WebClient } = require('@slack/web-api')
const dynamodb = require('../util/dynamodb')
const keyValue = require('../util/keyValue')
const slackClient = new WebClient(process.env.SLACK_TOKEN_BOT)

module.exports.loadUsers = () => {
  return slackClient.users.list()
    .then(({ members }) => members.filter(member => !member.is_bot))
    // .then(data => data.filter(member => !member.is_admin))
    .then(data => data.filter(member => !member.deleted))
    .then(data => data.filter(member => member.id !== 'USLACKBOT'))
}

module.exports.loadChannelMembers = async (channel) => {
  let members = []

  const params = {
    channel: channel,
    limit: 1000
  }

  for await (const page of slackClient.paginate('conversations.members', params)) {
    members = [...members, ...page.members]
  }

  return members
}

module.exports.allProfiles = async () => {
  var params = {
    TableName: 'profiles'
  }

  return await dynamodb.scan(params).promise().then(({ Items }) => Items)
}

module.exports.getUser = userId => {
  return slackClient.users.info({ user: userId })
    .then(({ user }) => user)
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
