const axios = require("axios")

const recommendForm = require("../blocks/recommendForm")
const notesForm = require("../blocks/notesForm")

module.exports = async (payload, jobID, form, user) => {
  try {
    const view = {
      token: process.env.SLACK_TOKEN_BOT,
      trigger_id: payload.trigger_id,
      view: JSON.stringify({
        type: "modal",
        title: {
          type: "plain_text",
          text: form === "recommend" ? "Recommend Applicant" : "Notes",
        },
        callback_id: `${form}_job-${jobID}`,
        submit: {
          type: "plain_text",
          text: "Submit",
        },
        close: {
          type: "plain_text",
          text: "Cancel",
        },
        blocks: form === "recommend" ? recommendForm : notesForm,
      }),
    }
    return await axios
      .post("https://slack.com/api/views.open", view, {
        headers: {
          Authorization: "Bearer " + process.env.SLACK_TOKEN_BOT,
          "Content-Type": "application/json",
        },
      })
      .then(data => {
        console.log("response: ", data.data)
        return { statusCode: 200, body: "" }
      })
      .catch(e => {
        console.log("dialog.open call failed: %o", e)
      })
  } catch (err) {
    if (err) console.log(err)
  }
}
