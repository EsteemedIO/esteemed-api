import { default as cron } from 'node-cron'
import { leads } from '../models/leads.js'
import { default as cache } from '../util/cache.js'

// Update jobs cache.
cron.schedule('* * * * *', async () => {
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
cron.schedule('* * * * *', async () => {
  if (process.env.NODE_ENV == 'production') {
    leads.getNew()
      .then(async newLeads => await Promise.all(newLeads.map(lead => leads.add(lead))))
      .then(res => res.map(lead => console.log(`Reference ${lead.data.data.firstName} ${lead.data.data.lastName} added as a lead.`)))
  }
})

export {
  cron
}
