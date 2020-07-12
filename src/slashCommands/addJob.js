const axios = require("axios")

const jobsForm = require("../blocks/jobsForm")

module.exports = async res => {
  console.log(payload)
  const dialog = {
    token: process.env.SLACK_TOKEN_BOT,
    trigger_id: payload.trigger_id,
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

  console.log(dialog)
  // return await api
  //   .post("views.open", null, { params: dialog })
  //   .then(data => {
  //     console.log(data.data)
  //     return { statusCode: 200, body: "" }
  //   })
  //   .catch(e => {
  //     console.log("dialog.open call failed: %o", e)
  //   })

  await axios.post("https://slack.com/api/views.open", dialog, {
      headers: {
        Authorization: "Bearer " + process.env.SLACK_TOKEN_BOT,
        "Content-Type": "application/json",
      },
    })
    .then(data => {
      //console.log('response: ', data.data)
      res.send()
    })
    .catch(e => {
      console.log("dialog.open call failed: %o", e)
    })
}
