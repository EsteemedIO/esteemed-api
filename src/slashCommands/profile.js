import * as userProfiles from './../util/userProfiles'

export async function view(handle) {
  let blocks

  const usersAndProfiles = await loadUsersAndProfiles()

  if (usersAndProfiles.error) {
    blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: usersAndProfiles.error
        }
      }
    ]
    return { response_type: 'in_channel', blocks: blocks }
  }

  const allUsers = usersAndProfiles.allUsers
  const allProfiles = usersAndProfiles.allProfiles

  const requestedUser = allUsers.find(user => user.name === handle.replace('@', '')) || false

  if (requestedUser) {
    const externalProfile = allProfiles.find(profile => profile.id === requestedUser.id)
    const text = userProfiles.format(requestedUser.profile, externalProfile)

    if (Object.prototype.hasOwnProperty.call(allProfiles.find(profile => profile.id === requestedUser.id), 'drupal_profile')) {
      // text += "\n" + "<" + allProfiles[requestedUser.id].drupal_profile + "|" + allProfiles[requestedUser.id].drupal_bio + ">"
    }

    if (Object.prototype.hasOwnProperty.call(allProfiles.find(profile => profile.id === requestedUser.id), 'wp_profile')) {
      // text += "\n" + "<" + allProfiles[requestedUser.id].wp_profile + "|" + allProfiles[requestedUser.id].wp_bio + ">"
    }

    blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: text
        },
        accessory: {
          type: 'image',
          image_url: requestedUser.profile.image_192,
          alt_text: requestedUser.profile.real_name
        }
      }
    ]
  } else {
    blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Wrong Username'
        }
      }
    ]
  }

  return { response_type: 'in_channel', blocks: blocks }
}

const loadUsersAndProfiles = async () => {
  try {
    return await Promise.all([userProfiles.loadUsers(), userProfiles.allProfiles()])
      .then(([users, allProfiles]) => ({
          allUsers: users,
          allProfiles: allProfiles
        }))
      .catch(error => console.error(error))
  } catch (error) { console.error(error) }
}
