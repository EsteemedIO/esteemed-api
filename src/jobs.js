const { jobsRef } = require('./util/firebase')

module.exports = async (res, next) => {
  try {
    const jobs = await getAllJobs()
    res.send({ body: Object.keys(jobs).reduce((acc, key) => {
      const job = {
        key: key,
        title: jobs[key].title,
        description: jobs[key].description,
        start_date: jobs[key].start_date,
        attendance: jobs[key].attendance,
        engagement: jobs[key].engagement,
        experience: jobs[key].experience,
        timezone: jobs[key].timezone,
        duration: jobs[key].duration,
        categories: jobs[key].categories,
        skills: jobs[key].skills,
        location_req: jobs[key].location_req,
        weekly_hours: jobs[key].weekly_hours,
      }
      acc.push(job)
      return acc
    }, []) })
  } catch (e) {
    next(e)
  }
}

const getAllJobs = () => {
  return jobsRef().get()
    .then(snapshot => snapshot.docs.reduce((obj, item) => {
      obj[item.id] = item.data()
      return obj
    }, {}))
    .catch(e => { console.log('Error getting documents', e) })
}
