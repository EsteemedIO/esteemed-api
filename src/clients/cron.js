import { app } from './slack.js'
import axios from 'axios'
import { Cron as cron } from 'croner'
import { default as cache } from '../util/cache.js'
import { jobs as dbJobs, locationFormat } from '../models/jobs.js'
import { jobs } from '../models/jobs.js'
import { leads } from '../models/leads.js'

export default function() {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  cron('0 8 * * *', async () => {
    const jobs = await dbJobs.getPriorityJobs(1)
    const dollarUS = Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    })
    const blocks = jobs
      .map(job => (
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Title: *<https://cls42.bullhornstaffing.com/BullhornSTAFFING/OpenWindow.cfm?Entity=JobOrder&id=${job.id}|${job.title}>* \nCompany: *${job.company}* \nType: *${job.type}* \nPay: *${dollarUS.format(job.pay)}/hour*`
          }
        }
      ))
      .flatMap(job => [job, {
          type: 'divider'
        }]).slice(0, -1)

    app.client.chat.postMessage({
      token: process.env.SLACK_TOKEN_BOT,
      channel: 'C03EVBP5ZCK',
      blocks: blocks
    })
  })

  // Update jobs cache.
  cron('*/30 * * * *', async () => {
    const key =  '__express__/jobs'
    cache.flush('/jobs')

    dbJobs.getAll()
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
    leads.getNew()
      .then(async newLeads => await Promise.all(newLeads.map(lead => leads.add(lead))))
      .then(res => res.map(lead => console.log(`Reference ${lead.data.data.firstName} ${lead.data.data.lastName} added as a lead.`)))
  })

  cron('0 * * * *', async () => {
    const jobUpdateAvailable = jobs.getJobUpdate()

    if (jobUpdateAvailable) {
      axios.post(`https://webhooks.amplify.us-east-1.amazonaws.com/prod/webhooks?id=bd8fedcd-d6a6-4eb1-ae2f-ac27dfb32c37&token=${process.env.AMPLIFY_TOKEN}`, {}, { headers: { 'Content-Type': 'application/json' }})
        .then(() => console.log('Amplify rebuild request successfully initiated'))
        .catch(err => console.error('Amplify rebuild request error: ', err.response.data))
    }
  })
}
