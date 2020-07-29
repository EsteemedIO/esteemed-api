import { WebClient } from '@slack/web-api'
import db from '../util/dynamodb'
import keyValue from '../util/keyValue'
const slackClient = new WebClient(process.env.SLACK_TOKEN_BOT)

export async function loadUsers() {
  return slackClient.users.list()
    .then(({ members }) => members.filter(member => !member.is_bot))
    // .then(data => data.filter(member => !member.is_admin))
    .then(data => data.filter(member => !member.deleted))
    .then(data => data.filter(member => member.id !== 'USLACKBOT'))
}

export async function loadChannelMembers(channel) {
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

export async function allProfiles() {
  var params = {
    TableName: 'profiles'
  }

  return await db.scan(params).promise().then(({ Items }) => Items)
}

export async function getUser(userId) {
  try {
    const { user } = await slackClient.users.info({ user: userId })
    return user
  }
  catch (err) {
    return console.log(err)
  }
}

export function format(profile, externalProfile) {
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

export async function isAdmin(userId) { await getUser(userId).then(user => user.is_admin) }
