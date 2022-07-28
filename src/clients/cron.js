import axios from 'axios'
import { Cron as cron } from 'croner'
import { default as cache } from '../util/cache.js'
import { getAll as getAllJobs, getJobUpdate, locationFormat } from '../models/jobs.js'
import { getNew as getNewLeads } from '../models/leads.js'
import report from '../util/report.js'
import { app } from '../clients/slack.js'

export default function() {
  const isInternal = process.env.HOSTNAME ? process.env.HOSTNAME.startsWith('esteemed-api-internal') : false;

  if (process.env.NODE_ENV !== 'production' || !isInternal) {
    return
  }

  // Update jobs cache.
  cron('*/30 * * * *', async () => {
    const key =  '__express__/jobs'
    cache.flush('/jobs')

    getAllJobs()
      .then(jobs => jobs.map(job => ({
          ...job,
          address: locationFormat(job.address)
      })))
      .then(jobs => {
        cache.setKey(key, JSON.stringify(jobs))
        cache.save()
        console.log('Jobs cache refreshed')
      })
  })

  // Add new references as leads.
  cron('*/30 * * * *', async () => {
    getNewLeads()
      .then(async newLeads => await Promise.all(newLeads.map(lead => leads.add(lead))))
      .then(res => res.map(lead => console.log(`Reference ${lead.data.data.firstName} ${lead.data.data.lastName} added as a lead.`)))
  })

  cron('0 * * * *', async () => {
    const jobUpdateAvailable = getJobUpdate()

    if (jobUpdateAvailable) {
      axios.post(`https://webhooks.amplify.us-east-1.amazonaws.com/prod/webhooks?id=bd8fedcd-d6a6-4eb1-ae2f-ac27dfb32c37&token=${process.env.AMPLIFY_TOKEN}`, {}, { headers: { 'Content-Type': 'application/json' }})
        .then(() => console.log('Amplify rebuild request successfully initiated'))
        .catch(err => console.error('Amplify rebuild request error: ', err.response.data))
    }
  })

  // Weekly update of sales numbers.
  cron('0 8 * * MON', async () => {
    const now = new Date().setHours(0, 0, 0, 0)
    const start = new Date(now)
    start.setDate(start.getDate() - start.getDay() - 7)
    const end = new Date(now)
    end.setDate(end.getDate() - end.getDay())

    report(start, end)
      .then(data => {
        const dataFormatted = Object.keys(data).map(function(key, index) {
          return `*${key}*: ${data[key]}`
        })

        app.client.chat.postMessage({
          token: process.env.SLACK_TOKEN_BOT,
          channel: 'C01TEMBSY6A',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Last week's sales numbers!* (${start.toLocaleString('en-US').split(',')[0]} - ${end.toLocaleString('en-US').split(',')[0]})`
              }
            },
            {
              type: 'divider'
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: dataFormatted.join("\n\n")
              }
            },
          ]
        })
      })
  })

  // Daily update of sales numbers.
  cron('0 8 * * *', async () => {
    const now = new Date().setHours(0, 0, 0, 0)
    const start = new Date(now)
    start.setDate(start.getDate() - 1)
    const end = new Date(now)

    report(start, end)
      .then(data => {
        const dataFormatted = Object.keys(data).map(function(key, index) {
          return `*${key}*: ${data[key]}`
        })

        app.client.chat.postMessage({
          token: process.env.SLACK_TOKEN_BOT,
          channel: 'C01TEMBSY6A',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Yesterday's sales numbers!* (${start.toLocaleString('en-US').split(',')[0]})`
              }
            },
            {
              type: 'divider'
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: dataFormatted.join("\n\n")
              }
            },
          ]
        })
      })
  })
}
