import axios from 'axios'
import { default as cron } from 'node-cron'

import { jobs as dbJobs, locationFormat } from '../models/jobs.js'
import { jobs } from '../models/jobs.js'
import { leads } from '../models/leads.js'
import { default as cache } from '../util/cache.js'

export default function() {
  // Update jobs cache.
  cron.schedule('*/30 * * * *', async () => {
    if (process.env.NODE_ENV == 'production') {
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
    }
  })

  // Add new references as leads.
  cron.schedule('*/30 * * * *', async () => {
    if (process.env.NODE_ENV == 'production') {
      leads.getNew()
        .then(async newLeads => await Promise.all(newLeads.map(lead => leads.add(lead))))
        .then(res => res.map(lead => console.log(`Reference ${lead.data.data.firstName} ${lead.data.data.lastName} added as a lead.`)))
    }
  })

  cron.schedule('0 * * * *', async () => {
    const jobUpdateAvailable = jobs.getJobUpdate()

    if (jobUpdateAvailable) {
      axios.post(`https://webhooks.amplify.us-east-1.amazonaws.com/prod/webhooks?id=bd8fedcd-d6a6-4eb1-ae2f-ac27dfb32c37&token=${process.env.AMPLIFY_TOKEN}`, {}, { headers: { 'Content-Type': 'application/json' }})
        .then(() => console.log('Amplify rebuild request successfully initiated'))
        .catch(err => console.error('Amplify rebuild request error: ', err.response.data))
    }
  })
}
