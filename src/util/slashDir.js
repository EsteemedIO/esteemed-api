const verifyRequest = require("../verifyRequest");
const qs = require("query-string");
const jobsList = require("../slashCommands/jobs_list");
const jobsAdd = require("../slashCommands/jobs_add");
const jobsUpdate = require("../slashCommands/jobs_edit");
const { getUser } = require("../util/userProfiles");

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
  const payload = qs.parse(event.body);
  const id = payload.user_id;
  const { user } = await getUser(id);
  const isAdmin = user.is_admin;
  const task = payload.text.split(" ")[0];
  const jobID = payload.text.split(" ")[1];

  // console.log(jobID);
  switch (task) {
    case "list":
      return await jobsList(event);
    case "add":
      return await jobsAdd(event, payload);
    case "edit":
      return isAdmin
        ? await jobsUpdate(payload, jobID)
        : { body: "you cannot do this" };
    default:
      console.log("Invalid Requesdt");
  }
};
