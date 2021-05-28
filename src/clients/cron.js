import { default as cron } from 'node-cron'

import { getHours, reduceEmails } from '../util/clockify.js'
import { jobs as dbJobs, locationFormat } from '../models/jobs.js'
import { leads } from '../models/leads.js'
import placements from '../models/placements.js'
import { createInvoice, convertClockifyToQBInvoice } from '../models/invoice.js'

export default function() {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

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

  // Every 2 weeks (on the 1st and 15th).
  cron.schedule('30 1 1,15 * *', async () => {
    // Create invoices.
    const projectHours = await getHours('projectName')
      .then(placements => placements.flat())
    const emails = reduceEmails(projectHours)
    const projectPlacements = await Promise.all(emails.map(async email => await placements.get(email)))
    const invoices = await convertClockifyToQBInvoice(projectHours, projectPlacements)

    invoices.map(companyHours => createInvoice(companyHours))
  })
}
