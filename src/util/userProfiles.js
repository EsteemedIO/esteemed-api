import slack from '@slack/web-api'
const { WebClient } = slack
import { profiles } from '../util/db.js'
import keyValue from '../util/keyValue.js'
const slackClient = new WebClient(process.env.SLACK_TOKEN_BOT)

export async function loadUser(userId) {
  return slackClient.users.profile.get({ user: userId })
}

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
  return profiles.getAll()
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
  return await profiles.get(userId)
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
  await profiles.update(user, { [action.action_id]: values })
}

export async function setUserJoinDate(user) {
  const date = new Date(user.updated * 1000)
  const join_date = date.toISOString().split('T')[0]

  // Add join date.
  return profiles.update(user.id, {
    firstName: user.profile.real_name.split(' ')[0],
    lastName: user.profile.real_name.split(' ').slice(1).join(' '),
    dateAdded: join_date
  })
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
