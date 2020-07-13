const axios = require("axios")
const crypto = require('crypto')

const dynamodb = require('../util/dynamodb')
const jobsForm = require("../blocks/jobsForm")
const activateBlock = require('../blocks/activateJob')
const keyValue = require('../util/keyValue')
const { getUser } = require('../util/userProfiles')
const flattenSlack = require('../util/flattenSlack')

module.exports.listJobs = async (req, res) => {
  try {
    const currentUser = await getUser(req.body.user_id)

    const blocks = await module.exports.getAllJobs()
      .then(jobs => jobs.map(job => {
        let text = [
          {
            key: keyValue.categories,
            value: job.categories.map(x => keyValue[x]).reduce((acc, i) => `${acc}\n- ${i}`, '')
          },
          {
            key: keyValue.attendance,
            value: keyValue[job.attendance]
          },
          {
            key: keyValue.experience,
            value: keyValue[job.experience]
          },
          {
            key: keyValue.engagement,
            value: keyValue[job.engagement]
          },
          {
            key: keyValue.duration,
            value: keyValue[job.duration]
          },
          {
            key: keyValue.weekly_hours,
            value: keyValue[job.weekly_hours]
          },
          {
            key: keyValue.location_req,
            value: keyValue[job.location_req]
          },
          {
            key: keyValue.description,
            value: job.description.replace(/<[^>]*>?/gm, '').substr(0, 280) + '...'
          },
        ]

        if (currentUser.is_admin) {
          text.push({
            key: keyValue.rate_client,
            value: `$${job.rate_client}`
          })
        }

        const block = {
          type: "section",
          text: {
            type: "mrkdwn",
            text: text.reduce((acc, i) => acc + `*${i.key}*: ${i.value}\n`, '')
          },
        }

        let button = {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: `Apply for ${job.title}`,
              },
              value: job.key,
              action_id: "apply_btn",
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Recommend Applicant",
              },
              value: job.key,
              action_id: "recommend_btn",
            },
          ],
        }

        if (currentUser.is_admin) {
          button.elements.push({
            type: "button",
            text: {
              type: "plain_text",
              text: "Add Notes",
            },
            value: job.key,
            action_id: "add-notes_btn",
          })
        }

        return [ block, button ]
      })
      .flatMap((v, i, a) => a.length - 1 !== i ? [v, { "type": "divider" }] : v)
      .flat()
    )

    res.send({ blocks: blocks })
  } catch (err) {
    if (err) return err
  }
}

module.exports.addJob = async job => {
  const date = new Date()
  const created = date.toISOString().split('T')[0]

  let item = flattenSlack.flatten(job)
  item.id = crypto.createHash('md5').update(created).digest('hex').substring(0, 12)
  item.created = created

  let params = {
    TableName: "jobs",
    Item: item
  }

  return await dynamodb.put(params).promise()
}

module.exports.updateJob = async job => {
  // if we want to add a field for when the post was created
  //? formVal.dateAdded = moment().format("lll")
  let params = {
    TableName: "jobs",
    Key: {
      id: job.id,
    },
    UpdateExpression: `set attendance = :attendance, categories = :categories, description = :description, duration = :duration, engagement = :engagement, experience = :experience, location_req = :location_req, start_date = :start_date, title = :title, weekly_hours = :weekly_hours, rate_client = :rate_client, rate_esteemed = :rate_esteemed, timezone = :timezone, salary_high = :salary_high, salary_low = :salary_low, skills = :skills`,
    ExpressionAttributeValues: {
      ':attendance': job.attendance,
      ':categories': job.categories,
      ':description': job.description,
      ':duration': job.duration,
      ':engagement': job.engagement,
      ':experience': job.experience,
      ':location_req': job.location_req,
      ':start_date': job.start_date,
      ':title': job.title,
      ':weekly_hours': job.weekly_hours,
      ':rate_client': job.rate_client,
      ':rate_esteemed': job.rate_esteemed,
      ':timezone': job.timezone,
      ':salary_high': job.salary_high,
      ':salary_low': job.salary_low,
      ':skills': job.skills,
    }
  }

  params.Item.id = jobID

  return await dynamodb.put(params).promise()
}

module.exports.dialog = async (req, res) => {
  const dialog = {
    token: process.env.SLACK_TOKEN_BOT,
    trigger_id: req.body.trigger_id,
    view: JSON.stringify({
      title: {
        type: "plain_text",
        text: "Add New Job",
      },
      type: "modal",
      callback_id: "add_job",
      submit: {
        type: "plain_text",
        text: "Create",
      },
      close: {
        type: "plain_text",
        text: "Cancel",
      },
      blocks: jobsForm,
    }),
  }

  await axios.post("https://slack.com/api/views.open", dialog, {
      headers: {
        Authorization: "Bearer " + process.env.SLACK_TOKEN_BOT,
        "Content-Type": "application/json",
      },
    })
    .then(data => res.send())
    .catch(e => {
      console.log("dialog.open call failed: %o", e)
    })

  res.send()
}

module.exports.editJobForm = async (req, res) => {
  try {
    var params = {
      TableName: 'jobs',
      Key: {
        id: jobID
      }
    }

    const documentData = await dynamodb.get(params).promise()
      .then(({ Items }) => Items)
      .then(doc => {
        if (!doc.exists) {
          console.log("No such document!")
        } else {
          return doc.data()
        }
      })
      .catch(err => {
        console.log("Error getting document", err)
      })

    const dbKeys = Object.keys(documentData)

    const currentJob = []

    //method to parse fb data and insert into slack block
    jobsForm.forEach((block, index) => {
      const target = block.block_id
      const item = documentData[target]
      // in case there is a field missing in the db
      if (dbKeys.indexOf(target) !== -1) {
        if (block.element.type === "multi_static_select") {
          block.element.initial_options = item.map(option => {
            return {
              text: {
                type: "plain_text",
                text: keyValue[option],
              },
              value: option,
            }
          })
        } else if (block.element.type === "static_select") {
          block.element.initial_option = {
            text: {
              type: "plain_text",
              text: keyValue[item],
            },
            value: item,
          }
        } else {
          if (block.element.type === "datepicker") {
            block.element.initial_date = item
          } else {
            block.element.initial_value = item
          }
        }
      }
      currentJob.push(block)
      if (index === jobsForm.length - 1) {
        activateBlock.element.initial_option = {
          text: {
            type: "plain_text",
            text: item ? "Yes" : "No",
          },
          value: item ? "true" : "false",
        }
        currentJob.push(activateBlock)
      }
    })

    console.log(currentJob[13].element.options)

    const view = {
      token: process.env.SLACK_TOKEN_BOT,
      trigger_id: payload.trigger_id,
      view: JSON.stringify({
        title: {
          type: "plain_text",
          text: "Edit Jobs",
        },
        callback_id: `edit_job-${jobID}`,
        submit: {
          type: "plain_text",
          text: "Update",
          emoji: true,
        },
        close: {
          type: "plain_text",
          text: "Cancel",
          emoji: true,
        },
        type: "modal",
        blocks: currentJob,
      }),
    }

    return await call(payload, view)
  } catch (err) {
    if (err) console.log(err)
  }
}

const call = async (payload, data) => {
  return axios.post('https://slack.com/api/chat.postMessage', null, {
    headers: { 'Content-Type': 'application/json' },
    params: { channel: payload.channel_id, token: process.env.SLACK_TOKEN, parse: 'full', blocks: JSON.stringify(data) }
  })
    .then(data => {
      console.log("response: ", data.data)
      return { statusCode: 200, body: "" }
    })
    .catch(e => {
      console.log("dialog.open call failed: %o", e)
    })
}

module.exports.getAllJobs = async () => {
  try {
    var params = {
      TableName: 'jobs',
    }

    return await dynamodb.scan(params).promise()
      .then(({ Items }) => Items)
      .catch(e => console.log(e))
  } catch (e) {
    console.log(e)

      return { statusCode: 400, body: JSON.stringify(e) }
  }
}