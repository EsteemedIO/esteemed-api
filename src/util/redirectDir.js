const verifyRequest = require("../verifyRequest");
const qs = require("query-string");
const submitToFB = require("../slashCommands/commit_to_FB");

exports.handler = async event => {
  const slackSignature = event.headers["X-Slack-Signature"];
  const timestamp = event.headers["X-Slack-Request-Timestamp"];
  const validUser = await verifyRequest(slackSignature, event.body, timestamp);

  if (validUser.statusCode === 200) {
    return dir(event);
  } else {
    //TODO create error msg
    console.log("YOU FAILED");
  }
};

const dir = async event => {
  const payload = JSON.parse(qs.parse(event.body).payload);
  const callback = payload.view.callback_id;
  console.log("here?", payload.view.state.values);

  switch (callback) {
    case "add_job":
      return await submitToFB(payload, "add");
    case "edit_job":
      return await submitToFB(payload, "edit");
    default:
      console.log("Invalid Requesdt");
  }
};
