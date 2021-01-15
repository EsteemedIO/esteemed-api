import './util/config.js'
import bolt from '@slack/bolt'
const { App, ExpressReceiver } = bolt
import flatCache from 'flat-cache'

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true
})

const app = new App({
  token: process.env.SLACK_TOKEN_BOT,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver
})

let cache = flatCache.load('esteemed-api')
let cacheMiddleware = (req, res, next) => {
  let key =  '__express__' + req.originalUrl || req.url
  let cacheContent = cache.getKey(key)

  if (cacheContent) {
    res.send(JSON.parse(cacheContent))
  }
  else {
    res.sendResponse = res.send
    res.send = (body) => {
      cache.setKey(key,body)
      cache.save()
      res.sendResponse(body)
    }

    next()
  }
}

import configuration from './configuration.js'
import commandProfile from './slashCommands/profile.js'
import commandLatestProfiles from './slashCommands/latestProfiles.js'

import { jobs as dbJobs } from './util/db.js'
import * as jobs from './slashCommands/job.js'
import defaultBlocks from './blocks/profile.js'
import * as wp from './blocks/wp.js'
import * as drupal from './blocks/drupal.js'
import * as location from './blocks/location.js'
import * as home from './blocks/home.js'
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
  let profile = await userProfiles.setUserJoinDate(event.user)

  console.log('User joined', event.user)
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
  jobsAll.response_type = 'in_channel'

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
  const modal = slackFormData.set(defaultBlocks, profile)

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

app.action('edit_job', async ({ action, ack, context, client, body }) => {
  await ack()

  const jobForm = await jobs.editJobForm(action.value, body.user.id)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: jobForm
  })

  console.log(result)
})

app.action('add_job_notes', async ({ action, ack, context, client, body }) => {
  await ack()

  const jobNotesForm = await jobs.addJobNoteForm(action.value)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: jobNotesForm
  })
  console.log(result)
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

  await jobs.update(view.private_metadata, body.user.id, { notes: view.state.values })
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
receiver.router.get('/config', (req, res) => configuration(res))
receiver.router.get('/jobs', cacheMiddleware, async (req, res, next) => dbJobs.getAll()
  .then(jobs => jobs.map(job => ({
      ...job,
      address: [job.address.city, job.address.state].filter(i => i !== null).join(', '),
  })))
  .then(jobs => res.send(jobs))
)

;(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})()
