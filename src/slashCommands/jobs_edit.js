const api = require("../util/api")();
const { jobsRef } = require("../util/firebase");
const editJobsBlock = require("../blocks/editJobs");
const axios = require("axios");

module.exports = async (payload, jobID) => {
  // const arr = editJobsBlock.map(x => {
  //   if (x.element.type === "static_select") {
  //     x.element.initial_option = {
  //       text: {
  //         type: "plain_text",
  //         text: `${err}`,
  //       },
  //       value: `${err}`,
  //     };
  //   } else {
  //     x.element.initial_value = `${err}`;
  //   }
  //   return x;
  // });
  // console.log(arr);

  //*==========================================================*//
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
      .catch(err => {
        console.log("Error getting document", err);
      });
    // console.log(documentData["description"]);

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
          // console.log(block.element.initial_option.text.text);
          block.element.initial_option.value = documentData[target];
        } else if (block.element.type === "datepicker") {
          block.element.initial_date = documentData[target];
        } else {
          block.element.initial_value = documentData[target];
        }
        currentJob.push(block);
      }
    });

    // console.log(bull[0].element.initial_option);

    // const elements = await Promise.all(
    //   Object.keys(documentData).map(async key => {
    //     return {
    //       type: "input",
    //       block_id: key,
    //       element: {
    //         multiline: key === "description" ? true : false,
    //         type: "plain_text_input",
    //         initial_value: documentData[key],
    //         action_id: "val",
    //       },
    //       label: {
    //         type: "plain_text",
    //         text: `${
    //           key.includes("_")
    //             ? key.charAt(0).toLocaleUpperCase() +
    //               key.slice(1).replace("_", " ")
    //             : key.charAt(0).toLocaleUpperCase() + key.slice(1)
    //         }`,
    //         emoji: false,
    //       },
    //     };
    //   })
    // ).then(async data => {
    //   console.log(data);

    // return {
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
    // });
    // return await call(elements);
    return await call(view);
  } catch (err) {
    if (err) console.log(err);
  }
};

const call = async data => {
  // return await api
  //   .post("views.open", null, { params: data })
  //   .then(da => {
  //     console.log(da.data);
  //     return { statusCode: 200, body: "" };
  //   })
  //   .catch(e => {
  //     console.log("views.open call failed: %o", e);
  //   });
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
