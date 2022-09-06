import axios from 'axios'
import { Cron as cron } from 'croner'
import { default as cache } from '../util/cache.js'
import { getAll as getAllJobs, getJobUpdate, locationFormat } from '../models/jobs.js'
import { getNew as getNewLeads } from '../models/leads.js'
import { salesReport } from '../util/report.js'
import { app } from '../clients/slack.js'
import { findMissingPlacements, findMissingProjects } from '../util/findMissing.js'

export default function() {
  const isInternal = process.env.HOSTNAME ? process.env.HOSTNAME.startsWith('esteemed-api-internal') : false;

  if (process.env.NODE_ENV !== 'production' || !isInternal) {
    return
  }

  // Check for missing Bullhorn placements and QBO projects.
  cron('0 8,14 * * 1-5', async () => {
    // Trishia Slack.
    const slackAlertChannel = 'U01U1NSD5UZ'
    // Albert Slack.
    //const slackAlertChannel = 'U01TCSHNCRJ'

    findMissingPlacements()
      .then(missing => {
        // Alert Trishia via DM.
        app.client.chat.postMessage({
          token: process.env.SLACK_TOKEN_BOT,
          channel: slackAlertChannel,
          text: 'Placement not found in Bullhorn',
          blocks: missing.map(miss => ({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `Placement not found: ${miss.email} at ${miss.project}`
              }
          }))
        })
      })

    findMissingProjects()
      .then(missing => {
        // Alert Trishia via DM.
        app.client.chat.postMessage({
          token: process.env.SLACK_TOKEN_BOT,
          channel: slackAlertChannel,
          text: 'Projects missing from QBO',
          blocks: missing.map(miss => ({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `<https://app.qbo.intuit.com/app/projects|${miss}>`
              }
          }))
        })
      })
  })

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

    salesReport(start, end)
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
  cron('0 8 * * 2-6', async () => {
    const now = new Date().setHours(0, 0, 0, 0)
    const start = new Date(now)
    start.setDate(start.getDate() - 1)
    const end = new Date(now)

    salesReport(start, end)
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
