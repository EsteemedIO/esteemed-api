// const api = require("./api")();
const { jobsRef } = require("./firebase");

const jobsList = async event => {
  try {
    const jobs = await getAllJobs();
    const jobsFiltered = Object.keys(jobs).reduce((acc, key) => {
      console.log(jobs[key]);
      const job = {
        key: key,
        title: jobs[key].job_title,
        start_date: jobs[key].start_date,
        attendance: jobs[key].attendance,
        engagement: jobs[key].engagement,
        experience: jobs[key].experiance,
        timezone: jobs[key].timezone,
        duration: jobs[key].duration,
        categories: jobs[key].categories,
        skills: jobs[key].skills,
        location_req: jobs[key].location_req,
        weekly_hours: jobs[key].availability,
        rate_esteemd: jobs[key].rate_esteemd,
        rate_client: jobs[key].rate_client,
        description: jobs[key].description,
      };
      acc.push(job);
      return acc;
    }, []);

    return JSON.stringify(jobsFiltered);
  } catch (e) {
    console.log(e);

    return { statusCode: 400, body: JSON.stringify(e) };
  }
};

const getAllJobs = () => {
  return jobsRef()
    .get()
    .then(snapshot =>
      snapshot.docs.reduce((obj, item) => {
        obj[item.id] = item.data();
        return obj;
      }, {})
    )
    .catch(e => {
      console.log("Error getting documents", e);
    });
};

module.exports = { jobsList };
