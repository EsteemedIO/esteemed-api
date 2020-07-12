const axios = require('axios')

const jobsForm = require('../blocks/jobsForm')
const activateBlock = require('../blocks/activateJob')
const keyValue = require('../util/keyValue')

module.exports = async (payload, jobID) => {
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
