import { app, receiver } from './clients/slack.js'
import { default as cache } from './util/cache.js'
import { default as cron } from './clients/cron.js'
import bodyParser from 'body-parser'
import fileupload from 'express-fileupload'
import { default as jimp } from 'jimp'
import { createInvoices } from './models/invoice.js'

import { jobs as dbJobs, locationFormat } from './models/jobs.js'

receiver.router.use(bodyParser.json());
receiver.router.use(bodyParser.urlencoded({ extended: true }));
receiver.router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
receiver.router.use(fileupload())

// Endpoints.
receiver.router.get('/resume-image', async (req, res, next) => {
  if (!req.query.image) {
    res.send('Missing image parameter')
  }
  else {
    jimp.read(req.query.image)
      .then(image => image.color([{ apply: 'greyscale', params: [100] }])
        .getBufferAsync('image/jpeg'))
      .then(img => {
        res.setHeader('Content-Type', 'image/jpeg')
        res.send(img)
      })
  }
})

receiver.router.get('/jobs', cache.middleware, async (req, res, next) => dbJobs.getAll()
  .then(jobs => jobs.map(job => ({
      ...job,
      address: locationFormat(job.address)
  })))
  .then(jobs => res.send(jobs))
)

receiver.router.post('/upload-applicant', async ({ body }, res, next) => {
  const { applicant, job } = body

  try {
    await app.client.chat.postMessage({
      token: process.env.SLACK_TOKEN_BOT,
      channel: 'G01KCLV77C0',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Job: <https://cls42.bullhornstaffing.com/BullhornSTAFFING/OpenWindow.cfm?Entity=JobOrder&id=${job.id}|${job.title}>`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Name: *${applicant.firstName} ${applicant.lastName}* \nEmail: <mailto:${applicant.email}|${applicant.email}> \nPhone: <tel:+${applicant.phone}| ${applicant.phone}> `
          }
        },
      ]
    })

    const message = `${applicant.firstName} applied for role: ${job.title}`
    console.log(message)
    res.json(message)
  } catch (err) {
    console.log('There was an issue submitting web-based applicant to Slack')
    return res.json(err.message)
  }
})

receiver.router.post('/upload-resume', async ({ files }, res, next) => {
  const resume = files.file

  try {
    const filetype = resume.mimetype.split("/")[1]
    const response = await app.client.files.upload({
      token:  process.env.SLACK_TOKEN_BOT,
      channels: 'G01KCLV77C0',
      filename: resume.name,
      filetype: filetype,
      initial_comment: "Download my resume here",
      file: resume.data
    })

    const message = `Resume uploaded to Slack`
    console.log(message)
    res.json(message)
  } catch (err) {
    console.log('There was an issue uploading resume from web-based applicant to Slack')
    res.json(err.message)
  }
})

receiver.router.post('/register-deal', async ({ body }, res, next) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    prospect_name,
    prospect_first_name,
    prospect_last_name,
    prospect_phone,
    prospect_email,
    prospect_details
  } = body

  try {
    await app.client.chat.postMessage({
      token: process.env.SLACK_TOKEN_BOT,
      channel: 'C01TVJTHM9R',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Deal registered!*`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Referer*\nName: *${first_name} ${last_name}* \nEmail: <mailto:${email}|${email}> \nPhone: <tel:+${phone}| ${phone}> `
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Prospect*\nCompany: ${prospect_name} \nName: *${prospect_first_name} ${prospect_last_name}* \nEmail: <mailto:${prospect_email}|${prospect_email}> \nPhone: <tel:+${prospect_phone}| ${prospect_phone}> \n Details: ${prospect_details}`
          }
        },
      ]
    })

    const message = `${first_name} registered a deal from ${prospect_name}`
    console.log(message)
    res.json({
      message: 'Success'
    })
  } catch (err) {
    console.log('There was an issue registering a deal')
    return res.json(err.message)
  }
})

receiver.router.post('/candidate-referral', async ({ body }, res, next) => {
  const {
    email,
    first_name,
    last_name,
    city,
    country,
    acquia_exams,
    skills,
    referer
  } = body
  console.log(Object.keys(skills).map(key => skills[key]).join(', '))

  try {
    await app.client.chat.postMessage({
      token: process.env.SLACK_TOKEN_BOT,
      channel: 'C01TVJTHM9R',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Candidate referred by *<@${referer}>*`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Candidate*\nName: *${first_name} ${last_name}*\nEmail: <mailto:${email}|${email}>\nLocation: ${city}, ${country}\nAcquia Exams: ${Object.keys(acquia_exams).map(key => acquia_exams[key]).join(', ')}\nSkills: ${Object.keys(skills).map(key => skills[key]).join(', ')}`
          }
        },
      ]
    })

    const message = `${referer} referred candidate: ${first_name} ${last_name}`
    console.log(message)
    res.json({
      message: 'Success'
    })
  } catch (err) {
    console.log('There was an issue adding a candidate referral')
    return res.json(err.message)
  }
})

// Handle invoicing.
const cliArgs = process.argv.slice(2)
if (cliArgs.length > 0 && cliArgs[0] == 'invoicing') {
  const create = cliArgs.includes('--go')
  const dates = cliArgs.slice(1).filter(i => i !== '--go')

  createInvoices(dates, create)
}

;(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})()

// Schedule cron tasks.
cron()
