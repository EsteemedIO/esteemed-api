import * as userProfiles from './../util/userProfiles'
import * as drive from '../util/googleDocAPI'
import db from '../util/dynamodb'

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

export async function createResume(handle) {
  let blocks
  const usersAndProfiles = await loadUsersAndProfiles()

  if (usersAndProfiles.length === 0) {
    blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: usersAndProfiles.error
        }
      }
    ]

    return { response_type: 'ephemeral', blocks: blocks }
  }

  const allUsers = usersAndProfiles.allUsers
  const allProfiles = usersAndProfiles.allProfiles
  const requestedUser = allUsers.find(user => user.name === handle.replace('@', '')) || false
  let currentExternalProfile = allProfiles.find(user => user.name === handle.replace('@', '')) || false

  // TODO remove START
  const tempExternalProfile = {
    locality: "Vladivostok, Russian Federation",
    languages:  ["Chinese", "English"],
    titles: [],
    cms: [],
    join_date: "05/08/2020",
    summary: "For the past 10+ years, I have worked to master the craft of web development. I am passionate about good process and exciting projects. I have an affinity for the front-end and emerging technologies such as JavaScript frameworks and 3D development.",
    skills: ["React.js", "Vue.js", "Node.js", "D3.js"],
    other_skills: ["Unity3D", "WebGL", "Adobe Photoshop"],
    experience: [
      {
        position:"Remote Fullstack Developer",
        from: "December 2018",
        to: "February 2020",
        company: "PUCS",
        description: "PUCS is a top rated digital agency working primarily through Upwork. As a fullstack developer I was responsible for a wide range of deliverables."
      },
      {
        position:"Remote Fullstack Developer",
        from: "December 2018",
        to: "February 2020",
        company: "PUCS",
        description: "PUCS is a top rated digital agency working primarily through Upwork. As a fullstack developer I was responsible for a wide range of deliverables."
      }
    ],
    projects: [
      {
        title: "Diamond Foundry",
        from: "07/2012",
        to: "01/2013",
        url: "https://studio.diamondfoundry.com",
        description: "Diamond foundry and ordering system"
      },
      {
        title: "Diamond Foundry",
        from: "07/2012",
        to: "01/2013",
        url: "https://studio.diamondfoundry.com",
        description: "Diamond foundry and ordering system"
      }
    ],
    education: [
      {
        university: "Beijing University of Technology",
        from: "April 2012",
        to: "September 2016",
        degree: "Bachelor of Engineering (B.Eng)"
      }
    ],
    certificates: [
      {
        title: "Cisco CCNA",
        date: "2019"
      }
    ]
  }

  if (!currentExternalProfile) currentExternalProfile = tempExternalProfile
  // TODO remove END

  if (!currentExternalProfile) currentExternalProfile = {}

  if (currentExternalProfile.resume_url) {
    blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${requestedUser.real_name}'s (previously generated) resume link*`
        }
      },
      {
        "type": "divider"
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: currentExternalProfile.resume_url
        }
      }
    ]

    return { response_type: 'ephemeral', blocks: blocks }
  } else {
    const docCreationResp = await drive.createResume(requestedUser.profile, currentExternalProfile)

    if (docCreationResp.success) {
      await updateProfileResumeURL(requestedUser.id, docCreationResp.resumeURL)
      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${requestedUser.real_name}'s resume link*`
          }
        },
        {
          "type": "divider"
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: docCreationResp.resumeURL
          }
        }
      ]
    } else {
      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${docCreationResp.message}*`
          }
        },
        {
          "type": "divider"
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: docCreationResp.bareMSG
          }
        }
      ]
    }

    return { response_type: 'in_channel', blocks: blocks }
  }
}

const loadUsersAndProfiles = async () => {
  try {
    return await Promise.all([userProfiles.loadUsers(), userProfiles.allProfiles()])
      .then(([users, allProfiles]) => ({
          allUsers: users,
          allProfiles: allProfiles
        }))
  } catch (error) { console.error(error) }
}

const updateProfileResumeURL = async (userId, resumeURL) => {
  const params = {
    TableName: 'profiles',
    Key: {
      id: userId
    },
    UpdateExpression: 'set resume_url = :resume_url',
    ExpressionAttributeValues: {
      ':resume_url': resumeURL
    }
  }

  await db.update(params).promise()
    .then(res => console.log(res))
    .catch(e => console.log(e))
}
