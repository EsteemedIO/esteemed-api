const { jobsRef } = require("../util/firebase");
const editJobsBlock = require("../blocks/editJobs");
const axios = require("axios");

module.exports = async (payload, jobID) => {
  try {
    const documentData = await jobsRef()
      .doc(jobID)
      .get()
      .then(doc => {
        if (!doc.exists) {
          console.log("No such document!");
        } else {
          return doc.data();
        }
      })
      .catch(err => {git 
        console.log("Error getting document", err);
      });

    const dbKeys = Object.keys(documentData);

    const currentJob = [];

    editJobsBlock.forEach(block => {
      const target = block.block_id;
      if (dbKeys.indexOf(target) !== -1) {
        if (block.element.type === "static_select") {
          // Remove "_" and capitolize the first letters of the words
          block.element.initial_option.text.text = documentData[
            target
          ].includes("_")
            ? documentData[target]
                .replace("_", " ")
                .split(" ")
                .reduce((acc, word) => {
                  acc += word.charAt(0).toUpperCase() + word.slice(1) + " ";
                  return acc;
                }, "")
                .trim()
            : documentData[target].charAt(0).toLocaleUpperCase() +
              documentData[target].slice(1);
          block.element.initial_option.value = documentData[target];
        } else if (block.element.type === "datepicker") {
          block.element.initial_date = documentData[target];
        } else {
          block.element.initial_value = documentData[target];
        }
        currentJob.push(block);
      }
    });

    const view = {
      token: process.env.SLACK_TOKEN_BOT,
      trigger_id: payload.trigger_id,
      view: JSON.stringify({
        title: {
          type: "plain_text",
          text: "Edit Jobs",
        },
        callback_id: "edit_job",
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
    };

    return await call(view);
  } catch (err) {
    if (err) console.log(err);
  }
};

const call = async data => {
  return await axios
    .post("https://slack.com/api/views.open", data, {
      headers: {
        Authorization: "Bearer " + process.env.SLACK_TOKEN_BOT,
        "Content-Type": "application/json",
      },
    })
    .then(data => {
      console.log("response: ", data.data);
      return { statusCode: 200, body: "" };
    })
    .catch(e => {
      console.log("dialog.open call failed: %o", e);
    });
};
