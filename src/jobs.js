const dynamodb = require('./util/dynamodb')

module.exports = async (res, next) => {
  try {
    var params = {
      TableName: 'jobs',
    };

    const jobs = await dynamodb.scan(params).promise().then(({ Items }) => Items)
    res.send(Object.keys(jobs).reduce((acc, key) => {
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
    }, []))
  } catch (e) {
    next(e)
  }
}
