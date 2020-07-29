const profiles = require('./../util/userProfiles');
const googleDocAPI = require('../util/googleDocAPI');
const axios = require('axios');
const dynamodb = require('../util/dynamodb');

module.exports.view = async (req, res, next) => {
  let blocks;

  const usersAndProfiles = await loadUsersAndProfiles(next);

  if(usersAndProfiles.error){
    blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: usersAndProfiles.error
        }
      }
    ]
    return res.send({ response_type: 'in_channel', blocks: blocks });;
  }

  const allUsers = usersAndProfiles.allUsers;
  const allProfiles = usersAndProfiles.allProfiles;
  const currentUser = allUsers.find(user => user.id === req.body.user_id);

  if (!(currentUser.is_admin || currentUser.is_owner)) {
    blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Only admin or owner can use this command'
        }
      }
    ]
  }

  const requestedUser = allUsers.find(user => user.name === req.body.text.replace('@', '')) || false;

  if (requestedUser) {
    const externalProfile = allProfiles.find(profile => profile.id === requestedUser.id)
    const text = profiles.format(requestedUser.profile, externalProfile)

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
  
  res.send({ response_type: 'in_channel', blocks: blocks });
}

module.exports.createResume = async (req, res, next) => {
  let blocks;
  const usersAndProfiles = await loadUsersAndProfiles(next);

  if(usersAndProfiles.error){
    blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: usersAndProfiles.error
        }
      }
    ]
    return res.send({ response_type: 'ephemeral', blocks: blocks });;
  }

  const allUsers = usersAndProfiles.allUsers;
  const allProfiles = usersAndProfiles.allProfiles;
  const currentUser = allUsers.find(user => user.id === req.body.user_id);
  let currentExternalProfile = allProfiles.find(profile => profile.id === req.body.user_id);

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
  if(!currentExternalProfile)
    currentExternalProfile = tempExternalProfile;
  // TODO remove END

  if(!currentExternalProfile)
    currentExternalProfile = {};

  if(currentExternalProfile.resume_url){
    blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Looks like you have your resume already.*"
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
    ];

    res.send({ response_type: 'ephemeral', blocks: blocks });
  }
  else{
    // res.send()

    const docCreationResp = await googleDocAPI.createResume(currentUser.profile, currentExternalProfile);
   
    if(docCreationResp.success){
      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Your resume link*"
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
      ];
      
      updateProfileResumeURL(req.body.user_id, docCreationResp.resumeURL);
    }
    else
      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*" + docCreationResp.message + "*"
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
      ];
      
      const headers = {
        'headers': {
          'Content-type': 'application/json'
        }
      }

      axios.post(req.body.response_url, {
        response_type: 'ephemeral', blocks: blocks
      }, headers)
      .then((resp) => {
        console.log("Requested to /create-resume command.")
      })
      .catch((error) => {
        console.error(error)
      })
    }
}

const loadUsersAndProfiles = async (next) => {
  try {
    return await Promise.all([profiles.loadUsers(), profiles.allProfiles()])
    .then(([users, allProfiles]) => {
      return ({
        allUsers: users,
        allProfiles: allProfiles
      });
    }).catch(e => {
      console.log(e);
      next(e);
      return {
        error: e
      };
    });
  } catch (e) {
    console.log(e);
    next(e);
    return {
      error: e
    };
  }
}

const updateProfileResumeURL = async (userId, resumeURL) => {
  // Update/Add resume url.
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

  await dynamodb.update(params).promise()
    .then(res => console.log(res))
    .catch(e => console.log(e))

  return {}
}