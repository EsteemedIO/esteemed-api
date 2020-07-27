const crypto = require('crypto')

const dynamodb = require('../util/dynamodb')
const jobsForm = require('../blocks/jobsForm')
const notesForm = require('../blocks/notesForm')
const keyValue = require('../util/keyValue')
const { getUser } = require('../util/userProfiles')
const slackFormData = require('../util/slackFormData')
const userProfiles = require('../util/userProfiles')

module.exports.listJobs = async userId => {
  try {
    const currentUser = await getUser(userId)

    const blocks = await module.exports.getJobs()
      .then(jobs => currentUser.is_admin ? jobs : jobs.filter(job => job.active === 'enabled'))
      .then(jobs => jobs.map(job => {
        const text = [
          {
            key: keyValue.categories,
            value: job.categories.map(x => keyValue[x]).reduce((acc, i) => `${acc}\n- ${i}`, '')
          },
          {
            key: keyValue.attendance,
            value: keyValue[job.attendance]
          },
          {
            key: keyValue.experience,
            value: keyValue[job.experience]
          },
          {
            key: keyValue.engagement,
            value: keyValue[job.engagement]
          },
          {
            key: keyValue.duration,
            value: keyValue[job.duration]
          },
          {
            key: keyValue.weekly_hours,
            value: keyValue[job.weekly_hours]
          },
          {
            key: keyValue.location_req,
            value: keyValue[job.location_req]
          },
          {
            key: keyValue.description,
            value: job.description.replace(/<[^>]*>?/gm, '').substr(0, 280) + '...'
          }
        ]

        if (currentUser.is_admin) {
          text.push({
            key: keyValue.rate_client,
            value: `$${job.rate_client}`
          })
        }

        const block = {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: text.reduce((acc, i) => acc + `*${i.key}*: ${i.value}\n`, '')
          }
        }

        const button = {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: `Apply for ${job.title}`
              },
              value: job.id,
              action_id: 'apply_btn'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Recommend Applicant'
              },
              value: job.id,
              action_id: 'recommend_btn'
            }
          ]
        }

        if (currentUser.is_admin) {
          button.elements.push({
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Job Notes'
            },
            value: job.id,
            action_id: 'add_job_notes'
          })

          button.elements.push({
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Edit Job'
            },
            value: job.id,
            action_id: 'edit_job'
          })
        }

        return [block, button]
      })
        .flatMap((v, i, a) => a.length - 1 !== i ? [v, { type: 'divider' }] : v)
        .flat()
      )

    return { blocks: blocks }
  } catch (err) {
    if (err) return err
  }
}

module.exports.confirmApplication = async job => {
  try {
    return {
      title: {
        type: 'plain_text',
        text: 'Confirmation'
      },
      callback_id: 'confirm_app',
      submit: {
        type: 'plain_text',
        text: 'Confirm'
      },
      close: {
        type: 'plain_text',
        text: 'Cancel'
      },
      type: 'modal',
      private_metadata: job,
      blocks: []
    }
  } catch (err) {
    if (err) console.log(err)
  }
}

module.exports.saveApplication = async (jobId, userId) => {
  let applicants = [
    {
      user: userId,
      date: new Date().toISOString()
    }
  ]

  const job = await module.exports.getJobs(jobId)

  if (job.applicants) {
    applicants = applicants.concat(job.applicants)
  }

  const params = {
    TableName: 'jobs',
    Key: {
      id: jobId
    },
    UpdateExpression: 'set applicants = :applicants',
    ExpressionAttributeValues: {
      ':applicants': applicants
    }
  }

  return await dynamodb.update(params).promise()
}

module.exports.addJob = async job => {
  const date = new Date()
  const created = date.toISOString().split('T')[0]

  const item = slackFormData.get(job)
  item.id = crypto.createHash('md5').update(created).digest('hex').substring(0, 12)
  item.created = created

  const params = {
    TableName: 'jobs',
    Item: item
  }

  return await dynamodb.put(params).promise()
}

module.exports.updateJob = async (jobId, values) => {
  const job = slackFormData.get(values)
  const params = {
    TableName: 'jobs',
    Key: {
      id: jobId
    },
    UpdateExpression: 'set active = :active, attendance = :attendance, categories = :categories, description = :description, #duration = :duration, engagement = :engagement, experience = :experience, location_req = :location_req, start_date = :start_date, title = :title, weekly_hours = :weekly_hours, rate_client = :rate_client, rate_esteemed = :rate_esteemed, #timezone = :timezone, skills = :skills',
    ExpressionAttributeValues: {
      ':active': job.active,
      ':attendance': job.attendance,
      ':categories': job.categories,
      ':description': job.description,
      ':duration': job.duration,
      ':engagement': job.engagement,
      ':experience': job.experience,
      ':location_req': job.location_req,
      ':start_date': job.start_date,
      ':title': job.title,
      ':weekly_hours': job.weekly_hours,
      ':rate_client': job.rate_client,
      ':rate_esteemed': job.rate_esteemed,
      ':timezone': job.timezone,
      ':skills': job.skills
    },
    ExpressionAttributeNames: {
      '#duration': 'duration',
      '#timezone': 'timezone'
    }
  }

  return await dynamodb.update(params).promise()
}

module.exports.addJobForm = async userId => {
  const isAdmin = await userProfiles.isAdmin(userId)

  return {
    title: {
      type: 'plain_text',
      text: 'Add New Job'
    },
    type: 'modal',
    callback_id: 'add_job',
    submit: {
      type: 'plain_text',
      text: 'Create'
    },
    close: {
      type: 'plain_text',
      text: 'Cancel'
    },
    blocks: jobsForm(isAdmin)
  }
}

module.exports.editJobForm = async (jobId, userId) => {
  try {
    const job = await module.exports.getJobs(jobId)
    const isAdmin = await userProfiles.isAdmin(userId)
    const blocks = slackFormData.set(jobsForm(isAdmin), job)

    return {
      title: {
        type: 'plain_text',
        text: 'Edit Jobs'
      },
      callback_id: 'edit_job',
      submit: {
        type: 'plain_text',
        text: 'Update'
      },
      close: {
        type: 'plain_text',
        text: 'Cancel'
      },
      type: 'modal',
      blocks: blocks,
      private_metadata: jobId
    }
  } catch (err) {
    if (err) console.log(err)
  }
}

module.exports.addJobNoteForm = async jobId => {
  try {
    const blocks = await module.exports.getJobs(jobId)
      .then(job => {
        if (job.notes !== undefined) {
          return Promise.all(job.notes.map(note => {
            return userProfiles.getUser(note.user)
              .then(user => {
                const date = parseInt(Date.parse(note.date) / 1000).toFixed(0)

                return {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*${user.profile.real_name} [<!date^${date}^{date} at {time}|Timestamp>]*: ${note.note}`
                  }
                }
              })
          }))
        } else {
          return []
        }
      })
      .then(notes => notesForm.concat({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Prior Notes*'
        }
      }).concat(notes))

    return {
      title: {
        type: 'plain_text',
        text: 'Job Notes'
      },
      callback_id: 'add_job_notes',
      submit: {
        type: 'plain_text',
        text: 'Add'
      },
      close: {
        type: 'plain_text',
        text: 'Cancel'
      },
      type: 'modal',
      blocks: blocks,
      private_metadata: jobId
    }
  } catch (err) {
    if (err) console.log(err)
  }
}

module.exports.updateNotes = async (jobId, userId, values) => {
  let notes = [
    {
      user: userId,
      date: new Date().toISOString(),
      note: slackFormData.get(values).notes
    }
  ]

  const job = await module.exports.getJobs(jobId)

  if (job.notes) {
    notes = notes.concat(job.notes)
  }

  const params = {
    TableName: 'jobs',
    Key: {
      id: jobId
    },
    UpdateExpression: 'set notes = :notes',
    ExpressionAttributeValues: {
      ':notes': notes
    }
  }

  return await dynamodb.update(params).promise()
}

module.exports.getJobs = async (item = null) => {
  try {
    const params = {
      TableName: 'jobs'
    }

    if (item !== null) {
      params.Key = { id: item }
      return await dynamodb.get(params).promise()
        .then(({ Item }) => Item)
        .catch(e => console.log(e))
    } else {
      return await dynamodb.scan(params).promise()
        .then(({ Items }) => Items)
        .catch(e => console.log(e))
    }
  } catch (e) {
    console.log(e)

    return { statusCode: 400, body: JSON.stringify(e) }
  }
}
