import './util/config.js'
import bolt from '@slack/bolt'
const { App, ExpressReceiver } = bolt
import bodyParser from'body-parser'
import fileupload from 'express-fileupload'
import { default as cron } from 'node-cron'

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
})

const app = new App({
  token: process.env.SLACK_TOKEN_BOT,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver
})

receiver.router.use(bodyParser.json());
receiver.router.use(bodyParser.urlencoded({ extended: true }));
receiver.router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
receiver.router.use(fileupload())

import { jobs as dbJobs, locationFormat } from './models/jobs.js'
import { leads } from './models/leads.js'
import commandProfile from './slashCommands/profile.js'
import commandLatestProfiles from './slashCommands/latestProfiles.js'
import * as jobs from './slashCommands/job.js'
import defaultBlocks from './blocks/profile.js'
import * as wp from './blocks/wp.js'
import * as drupal from './blocks/drupal.js'
import * as location from './blocks/location.js'
import * as home from './blocks/home.js'
import { default as cache } from './util/cache.js'
import { countryOptions } from './util/countryCodes.js'
import * as userProfiles from './util/userProfiles.js'
import * as slackFormData from './util/slackFormData.js'
import * as tasks from './util/tasks.js'

// Events.
app.event('app_home_opened', async ({ event, client }) => {
  try {
    const blocks = await home.view(event.user)
    const view = {
      user_id: event.user,
      view: {
        type: 'home',
        blocks: blocks,
      }
    }
    const result = await client.views.publish(view)
    console.log('App Home opened by', event.user)
  } catch (error) {
    console.error('Error when opening App Home', error)
  }
})

app.event('team_join', async ({ event }) => {
  let profile = await userProfiles.setUserJoinDate(event.user, event.event_ts)

  console.log('New user joined:', event.user.real_name)
})

app.command('/profile', async ({ command, ack, respond }) => {
  await ack()

  const userId = command.text.substring(2).split('|')[0]

  const profile = await commandProfile(userId)

  await respond(profile)

  console.log('Profile', userId, 'queried by', command.user_id)
})

app.command('/profiles-latest', async ({ ack, command, respond }) => {
  await ack()

  const profiles = await commandLatestProfiles(command.user_id)

  await respond(profiles)

  console.log('Latest profiles queried by', command.user_id)
})

app.command('/jobs-list', async ({ ack, command, respond }) => {
  await ack()

  const jobsAll = await jobs.listJobs(command.user_id)

  await respond(jobsAll)
})

app.command('/add-job', async ({ ack, command, context, client }) => {
  await ack()

  try {
    const jobForm = await jobs.addJobForm(command.user_id)

    const result = await client.views.open({
      token: context.botToken,
      trigger_id: command.trigger_id,
      view: jobForm
    })
    console.log(result)
  } catch (error) {
    console.error(error)
  }
})

// Actions.
app.action('edit_profile', async ({ action, ack, context, client, body }) => {
  await ack()

  const profile = await userProfiles.getProfile(body.user.id)
  const modal = slackFormData.set(await defaultBlocks(), profile)

  await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: {
      callback_id: 'edit_profile',
      type: "modal",
      title: {
        "type": "plain_text",
        "text": "Edit Profile",
      },
      submit: {
        "type": "plain_text",
        "text": "Submit",
      },
      close: {
        "type": "plain_text",
        "text": "Cancel",
      },
      blocks: modal
    }
  })

  console.log('Profile edit form open by user', body.user.id)
})

app.action({ block_id: 'drupal_profile' }, async ({ context, client, body, ack }) => {
  await ack()

  const modal = await drupal.modal(body.user.id)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })

  console.log('Drupal profile form opened by user', body.user.id)
})

app.action({ block_id: 'wp_profile' }, async ({ context, client, body, ack }) => {
  await ack()

  const modal = await wp.modal(body.user.id)

  const result = client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })

  console.log('WP profile form opened by user', body.user.id)
})

app.action('locality', async ({ context, client, body, ack }) => {
  await ack()

  const profile = await userProfiles.getProfile(body.user.id)
  const modal = location.modal(profile.location)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })

  console.log('Location information updated by', body.user.id)
})

app.action('add_job_notes', async ({ action, ack, context, client, body }) => {
  await ack()

  // Check for user admin level.
  const profile = await userProfiles.getUser(body.user.id)

  if (profile.is_admin) {
    const jobNotesForm = await jobs.addJobNoteForm(action.value)

    const result = await client.views.open({
      token: context.botToken,
      trigger_id: body.trigger_id,
      view: jobNotesForm
    })

    console.log('Notes form opened for job ', action.value)
  }
})

app.action('apply_btn', async ({ action, ack, context, client, body }) => {
  await ack()

  const confirmForm = await jobs.confirmApplication(action.value)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: confirmForm
  })
  console.log(result)
})

app.action(/^(titles|skills|builders|languages|cms|date_available|availability|citizen|english)$/, async ({ ack, body, action, context, client }) => {
  await ack()

  userProfiles.updateProfile(body.user.id, action)

  console.log(action, 'field updated by user', body.user.id)
})

app.action({ action_id: 'complete_task' }, async ({ client, context, ack, action, body }) => {
  await ack()

  // Get faux state.
  const preBlockState = [...body.view.blocks].map(block => {
    if (block.accessory && block.accessory.value == action.value) {
      block.text = {
        type: 'mrkdwn',
        text: `:white_check_mark: ${block.text.text}`
      }
      delete block.accessory
    }
    return block
  })

  await client.views.publish({
    token: context.botToken,
    user_id: body.user.id,
    view: {
      type: 'home',
      blocks: preBlockState,
    }
  })

  // Update user.
  await tasks.updateUserTasks(body.user.id, action.value)
  const blocks = await home.view(body.user.id)

  await client.views.publish({
    token: context.botToken,
    user_id: body.user.id,
    view: {
      type: 'home',
      blocks: blocks,
    }
  })

  console.log(action.value, '- task completed by', body.user.id)
})

app.action('edit_job', async ({ ack }) => await ack())
app.action('job_link', async ({ ack }) => await ack())

// Views submissions.
app.view('add_job', async ({ view, ack }) => {
  await ack()

  await jobs.addJob(view.state.values)
})

app.view('edit_job', async ({ ack, view }) => {
  await ack()

  await jobs.update(view.private_metadata, view.state.values)
})

app.view('add_job_notes', async ({ ack, body, view }) => {
  await ack()

  // Check for user admin level.
  const profile = await userProfiles.getUser(body.user.id)

  if (profile.is_admin) {
    await dbJobs.addNote(view.private_metadata, body.user.id, view.state.values.notes.val.value)
  }
})

app.view('confirm_app', async ({ ack, body, view }) => {
  await ack()

  await job.update(view.private_metadata, { applicants: body.user.id })
})

app.view('update_location', async ({ ack, body, view, context, client }) => {
  await ack()
  const result = await client.views.publish({
    token: context.botToken,
    user_id: body.user.id,
    view: {
      type: 'home',
      blocks: await home.view(body.user.id)
    }
  })
  location.update(body.user.id, view.state.values)

  console.log('Location data updated by user', body.user.id)
})

app.view('update_drupal_profile', async ({ ack, body, view }) => {
  await ack()

  await drupal.updateProfile(body.user.id, view.state.values)

  console.log('Drupal profile updated by user', body.user.id)
})

app.view('update_wp_profile', async ({ ack, body, view }) => {
  await ack()

  wp.updateProfile(body.user.id, view.state.values)

  console.log('WP profile updated by user', body.user.id)
})

app.view('edit_profile', async ({ client, body, context, ack }) => {
  await ack()

  try {
    const result = await client.views.publish({
      token: context.botToken,
      user_id: body.user.id,
      view: {
        type: 'home',
        blocks: await home.view(body.user.id)
      }
    })

    console.log('Profile updated by user', body.user.id)
  } catch (error) {
    console.error(error)
  }
})

app.options({ action_id: 'bh_country_codes' }, async ({ options, ack }) => {
  // Return the country list filtered by the inputted search string.
  ack({
    options: countryOptions().filter(i => i.text.text.toLowerCase().indexOf(options.value.toLowerCase()) >= 0)
  })
})

// Endpoints.
receiver.router.get('/jobs', cache.middleware, async (req, res, next) => dbJobs.getAll()
  .then(jobs => jobs.map(job => ({
      ...job,
      address: locationFormat(job.address)
  })))
  .then(jobs => res.send(jobs))
)

receiver.router.post('/upload-applicant', async ({ body } ,res, next) => {
  const { applicant, jobId } = body

  try {
    await app.client.chat.postMessage({
      token: process.env.SLACK_TOKEN_BOT,
      channel: 'G01KCLV77C0',
      blocks: [
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

    const message = `${applicant.firstName} applied for role`
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

;(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})()
