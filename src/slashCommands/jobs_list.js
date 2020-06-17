const axios = require("axios");
const { jobsList } = require("../util/jobsList");

module.exports = async event => {
  const jobsString = await jobsList(event);
  return displayJobs(jobsString);
};

const displayJobs = async jobsString => {
  try {
    const jobs = JSON.parse(jobsString);
    const listRef = [];

    const listArr = jobs.map(job => {
      return Object.keys(job).reduce((acc, key) => {
        const line = {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${
              key.includes("_")
                ? key.charAt(0).toLocaleUpperCase() +
                  key.slice(1).replace("_", " ")
                : key.charAt(0).toLocaleUpperCase() + key.slice(1)
            }*: ${job[key]}`,
          },
        };
        acc.push(line);
        return acc;
      }, []);
    });

    listArr.forEach(x => {
      x.push({ type: "divider" });
      listRef.push(...x);
    });

    const jobsList = {
      type: "home",
      blocks: listRef,
    };
    console.log(jobsList);

    return await axios.post(process.env.SLACK_SLASH_COMMAND_HOOK, jobsList, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err) return err;
  }
};
