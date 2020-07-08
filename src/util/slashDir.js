const qs = require("query-string")

const verifyRequest = require("../verifyRequest")
const jobsList = require("../slashCommands/jobs_list")
const jobsAdd = require("../slashCommands/jobs_add")
const jobsUpdate = require("../slashCommands/jobs_edit")
const { getUser } = require("../util/userProfiles")
const submitToFB = require("../slashCommands/commit_to_FB")
const modal = require("../slashCommands/modal")

exports.handler = async event => {
  const slackSignature = event.headers["X-Slack-Signature"]
  const timestamp = event.headers["X-Slack-Request-Timestamp"]
  const validUser = await verifyRequest(slackSignature, event.body, timestamp)
  const path = event.pathParameters.type

  if (validUser.statusCode === 200) {
    if (path === "dir") {
      return dir(event)
    }
    if (path === "re_dir") {
      return redirect(event)
    }
    return { error: "drectory path not found " }
  } else {
    return { error: "Unauthorized User" }
  }
}

// Function to handle incoming slash commands
const dir = async event => {
  const payload = qs.parse(event.body)
  const id = payload.user_id
  const { user } = await getUser(id)
  const isAdmin = user.is_admin
  const task = payload.text.split(" ")[0]
  const jobID = payload.text.split(" ")[1]

  switch (task) {
    case "list":
      return isAdmin ? await jobsList(event, "admin") : await jobsList(event)
    case "add":
      return await jobsAdd(payload)
    case "edit":
      return isAdmin
        ? await jobsUpdate(payload, jobID)
        : { body: "You must be an Admin to edit" }
    default:
      return { error: "Invalid Requesdt" }
  }
}

// Function to handle submissions from completed slack forms
const redirect = async event => {
  const payload = JSON.parse(qs.parse(event.body).payload)
  const id = payload.user.id
  const { user } = await getUser(id)

  //handle jobs list button cicks
  if (payload.type === "block_actions") {
    const btnID = payload.actions[0].value
    const btnType = payload.actions[0].action_id
    if (btnType === "apply_btn") {
      return await submitToFB(payload, "apply_btn", btnID, user)
    }
    if (btnType === "recommend_btn") {
      return modal(payload, btnID, "recommend")
    }
    if (btnType === "add-notes_btn") {
      return modal(payload, btnID, "notes", user)
    }
  }

  const callback = payload.view.callback_id.split("-")[0]
  const jobID = payload.view.callback_id.split("-")[1]

  switch (callback) {
    case "add_job":
      return await submitToFB(payload, "add")
    case "edit_job":
      return await submitToFB(payload, "edit", jobID)
    case "recommend_job":
      return await submitToFB(payload, "recommend", jobID, user)
    case "notes_job":
      return await submitToFB(payload, "notes", jobID, user)

    default:
      console.log("Invalid Requesdt")
  }
}
