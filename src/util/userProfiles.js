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

export async function getProfile(userId) {
  const params = {
    TableName: 'profiles',
    Key: {
      id: userId
    }
  }

  return (await db.get(params).promise().then(({ Item }) => Item) || {})
}

export async function updateProfile(user, action) {
  let values = []

  switch (action.type) {
    case 'static_select':
      values = action.selected_option.value
      break
    case 'multi_static_select':
      values = action.selected_options.map(option => option.value)
      break
    case 'datepicker':
      values = action.selected_date
      break
  }

  // Update profile data.
  const params = {
    TableName: 'profiles',
    Key: {
      id: user
    },
    UpdateExpression: 'set ' + action.action_id + ' = :v',
    ExpressionAttributeValues: {
      ':v': values
    }
  }

  await db.update(params).promise()
    .then(res => console.log(res))
    .catch(e => console.log(e))
}

export async function setUserJoinDate(user) {
  const date = new Date(user.updated * 1000)
  const join_date = date.toISOString().split('T')[0]

  // Add join date.
  const params = {
    TableName: 'profiles',
    Item: {
      id: user.id,
      join_date: join_date
    }
  }
  console.log('user joined: ', params)

  return await db.put(params).promise()
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
