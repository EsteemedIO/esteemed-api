const axios = require("axios");
const keyValue = require("../util/keyValue");
const { jobsList } = require("../util/jobsList");

module.exports = async (event, admin) => {
  const jobsString = await jobsList(event);
  return displayJobs(jobsString, admin);
};

const displayJobs = async (jobsString, admin) => {
  try {
    const jobs = JSON.parse(jobsString);

    const blocksArr = [];

    jobs.forEach((job, i) => {
      const text = Object.keys(job).reduce((acc, key) => {
        //capitolize the first and second letter of the categories
        const keyFormated = `*${
          key.includes("_")
            ? key.charAt(0).toLocaleUpperCase() + key.slice(1).replace("_", " ")
            : key.charAt(0).toLocaleUpperCase() + key.slice(1)
        }*`;

        //deteremain how to format the values

        if (
          key === "attendance" ||
          key === "engagement" ||
          key === "duration" ||
          key === "weekly_hours" ||
          key === "location_req"
        ) {
          acc += `${keyFormated}: ${keyValue[job[key]]} \n`;
        } else if (key === "categories" || key === "skills") {
          acc += `${keyFormated} `;
          job[key].map(
            (x, i) =>
              (acc += ` ${keyValue[x]} ${
                job[key].length === i + 1 ? "\n" : ":"
              } `)
          );
        } else if (key === "key" || key === "rate_client") {
          if (!admin) {
          } else {
            acc += `${keyFormated} : ${job[key]} \n`;
          }
        } else {
          acc += `${keyFormated} : ${job[key]} \n`;
        }

        return acc;
      }, "");

      const block = {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${text} \n`,
        },
      };
      const button = {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: `Apply for ${job["title"]}`,
            },
            value: job["key"],
            action_id: "apply_btn",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Recommend Applicant",
            },
            value: job["key"],
            action_id: "recommend_btn",
          },
        ],
      };
      if (admin) {
        button.elements.push({
          type: "button",
          text: {
            type: "plain_text",
            text: "Add Notes",
          },
          value: job["key"],
          action_id: "add-notes_btn",
        });
      }
      console.log(button.elements);

      const divide = { type: "divider" };
      blocksArr.push(divide, block, button);
    });

    const jobsList = {
      type: "home",
      callback_id: "apply_job",
      blocks: blocksArr,
      type: "divider",
    };

    return await axios
      .post(process.env.SLACK_SLASH_COMMAND_HOOK, jobsList, {
        headers: { "Content-Type": "application/json" },
      })
      .then(() => ({ statusCode: 200, body: "" }));
  } catch (err) {
    if (err) return err;
  }
};
