import crypto from 'crypto'
import { default as striptags } from 'striptags'

import { jobs as dbJobs, locationFormat } from '../models/jobs.js'
import jobsForm from '../blocks/jobsForm.js'
import notesForm from '../blocks/notesForm.js'
import { getUser } from '../util/userProfiles.js'
import * as slackFormData from '../util/slackFormData.js'
import * as userProfiles from '../util/userProfiles.js'

export async function listJobs(userId) {
  try {
    const currentUser = await getUser(userId)

    const blocks = await dbJobs.getAll()
      .then(jobs => jobs.slice(0,15).map(job => {
        const text = [
          {
            key: 'Title',
            value: job.title
          },
          {
            key: 'Location',
            value: locationFormat(job.address)
          },
          {
            key: 'Employment Type',
            value: job.employmentType
          },
          {
            key: 'Start Date',
            value: job.startDate
          },
        ]

        /*
        if (currentUser.is_admin) {
          text.push({
            key: keyValue.rate_client,
            value: `$${job.rate_client}`
          })
        }
        */

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
              url: `https://talent.esteemed.io/jobs/${job.id}`,
              action_id: 'job_link'
            },
            /*
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
            */
          ]
        }

        if (currentUser.id == 'UL8N9QSLU') {
          button.elements.push({
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Job Notes'
            },
            value: job.id.toString(),
            action_id: 'add_job_notes'
          })
        }

        if (currentUser.is_admin) {
          button.elements.push({
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Edit Job'
            },
            url: `https://cls42.bullhornstaffing.com/BullhornSTAFFING/OpenWindow.cfm?Entity=JobOrder&id=${job.id}`,
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

export async function confirmApplication(job) {
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

export async function saveApplication(jobId, userId) {
  let applicants = [
    {
      user: userId,
      date: new Date().toISOString()
    }
  ]

  const job = await dbJobs.get(jobId)

  if (job.applicants) {
    applicants = applicants.concat(job.applicants)
  }

  return await dbJobs.update(jobId, { applicants: applicants })
}

export async function addJob(job) {
  const date = new Date()
  const created = date.toISOString().split('T')[0]

  const item = slackFormData.get(job)
  item.id = crypto.createHash('md5').update(created).digest('hex').substring(0, 12)
  item.created = created

  return await dbJobs.post(item)
}

export async function updateJob(jobId, values) {
  const job = slackFormData.get(values)
  return await dbJobs.update(jobId, job)
}

export async function addJobForm(userId) {
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

export async function editJobForm(jobId, userId) {
  try {
    const job = await dbJobs.get(jobId)
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

export async function addJobNoteForm(jobId) {
  try {
    const blocks = await dbJobs.getNotes(jobId)
      .then(notes => notes.map(note => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${note.commentingPerson.firstName} ${note.commentingPerson.lastName} [<!date^${note.dateAdded}^{date} at {time}|Timestamp>]*: ${striptags(note.comments).split(/[\s\n]+/).slice(0,60).join(' ')}…`
        }
      })))
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
    if (err) console.error(err)
  }
}

export async function updateNotes(jobId, userId, values) {
  let notes = [
    {
      user: userId,
      date: new Date().toISOString(),
      note: slackFormData.get(values).notes
    }
  ]

  const job = await dbJobs.get(jobId)

  if (job.notes) {
    notes = notes.concat(job.notes)
  }

  return await dbJobs.update(jobId, { notes: notes })
}

export function apiFormat(jobs) {
  return Object.keys(jobs).reduce((acc, key) => {
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
      weekly_hours: jobs[key].weekly_hours
    }
    acc.push(job)
    return acc
}, [])
}
