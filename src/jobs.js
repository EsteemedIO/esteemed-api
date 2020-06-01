const api = require('./util/api')()
const { jobsRef } = require('./util/firebase')

exports.handler = async event => {
  try {
    const jobs = await getAllJobs()
    const jobsFiltered = Object.keys(jobs).reduce((acc, key) => {
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
    }, [])

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(jobsFiltered),
    }
  } catch (e) {
    console.log(e)

    return { statusCode: 400, body: JSON.stringify(e) }
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
