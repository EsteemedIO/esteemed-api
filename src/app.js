import { createServer, proxy } from 'aws-serverless-express'
import { App, ExpressReceiver } from '@slack/bolt'

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
})

const server = createServer(receiver.app)

const app = new App({
  token: process.env.SLACK_TOKEN_BOT,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver
})

import configuration from './configuration'
import profiles from './profiles'
import commandProfile from './slashCommands/profile'
import commandLatestProfiles from './slashCommands/latestProfiles'

import * as jobs from './slashCommands/job'
import defaultBlocks from './blocks/profile'
import * as wp from './blocks/wp'
import * as drupal from './blocks/drupal'
import * as location from './blocks/location'
import * as home from './blocks/home'
import * as userProfiles from './util/userProfiles'
import * as slackFormData from './util/slackFormData'
import * as tasks from './util/tasks'

// Events.
app.event('app_home_opened', async ({ event, context, client }) => {
  try {
    const result = await client.views.publish({
      token: context.botToken,
      user_id: event.user,
      view: {
        type: 'home',
        blocks: await home.view(event.user)
      }
    })
    console.log(result)
  } catch (error) {
    console.error(error)
  }
})

app.event('team_join', async ({ event, ack }) => {
  let profile = await userProfiles.setUserJoinDate(event.user)

  console.log('profile: ', profile)

  await ack()

  console.log('User added!')
})

app.command('/profile', async ({ command, ack, respond }) => {
  const profile = await commandProfile(command.text)

  await respond(profile)

  await ack()
})

app.command('/profiles-latest', async ({ ack, command, respond }) => {
  const profiles = await commandLatestProfiles(command.user_id)

  await respond(profiles)
})

app.command('/jobs-list', async ({ ack, command, respond }) => {
  const jobsAll = await jobs.listJobs(command.user_id)
  jobsAll.response_type = 'in_channel'

  await respond(jobsAll)

  await ack()
})

app.command('/add-job', async ({ ack, command, context, client }) => {
  try {
    const jobForm = await jobs.addJobForm(command.user_id)

    const result = await client.views.open({
      token: context.botToken,
      trigger_id: command.trigger_id,
      view: jobForm
    })
    console.log(result)

    await ack()
  } catch (error) {
    console.error(error)
  }
})

// Actions.
app.action('edit_profile', async ({ action, ack, context, client, body }) => {
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

  await ack()
})

app.action({ block_id: 'drupal_profile' }, async ({ context, client, body, ack }) => {
  const modal = await drupal.modal(body.user.id)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })
  console.log(result)

  await ack()
})

app.action({ block_id: 'wp_profile' }, async ({ context, client, body, ack }) => {
  const modal = await wp.modal(body.user.id)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })
  console.log(result)

  await ack()
})

app.action('locality', async ({ context, client, body, ack }) => {
  const profile = await userProfiles.getProfile(body.user.id)
  const modal = await location.modal(profile.locality)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })
  console.log(result)

  await ack()
})

app.action('edit_job', async ({ action, ack, context, client, body }) => {
  const jobForm = await jobs.editJobForm(action.value, body.user.id)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: jobForm
  })
  console.log(result)

  await ack()
})

app.action('add_job_notes', async ({ action, ack, context, client, body }) => {
  const jobNotesForm = await jobs.addJobNoteForm(action.value)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: jobNotesForm
  })
  console.log(result)

  await ack()
})

app.action('apply_btn', async ({ action, ack, context, client, body }) => {
  const confirmForm = await confirmApplication(action.value)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: confirmForm
  })
  console.log(result)

  await ack()
})

app.action(/^(titles|skills|builders|languages|cms|date_available|availability|citizen|english)$/, async ({ ack, body, action, context, client }) => {
  await userProfiles.updateProfile(body.user.id, action)

  await ack()
})

app.action({ action_id: 'complete_task' }, async ({ client, context, ack, action, body }) => {
  await tasks.updateUserTasks(body.user.id, action.value)

  await client.views.publish({
    token: context.botToken,
    user_id: body.user.id,
    view: {
      type: 'home',
      blocks: await home.view(body.user.id)
    }
  })

  await ack()
})

// Views submissions.
app.view('add_job', async ({ view, ack }) => {
  await jobs.addJob(view.state.values)

  await ack()
})

app.view('edit_job', async ({ ack, view }) => {
  await jobs.updateJob(view.private_metadata, view.state.values)

  await ack()
})

app.view('add_job_notes', async ({ ack, body, view }) => {
  await jobs.updateNotes(view.private_metadata, body.user.id, view.state.values)

  await ack()
})

app.view('confirm_app', async ({ ack, body, view }) => {
  await saveApplication(view.private_metadata, body.user.id)

  await ack()
})

app.view('update_location', async ({ ack, body, view, context, client }) => {
  await location.update(body.user.id, view.state.values.update_location.val.value)

  const result = await client.views.publish({
    token: context.botToken,
    user_id: body.user.id,
    view: {
      type: 'home',
      blocks: home
    }
  })
  console.log(result)

  await ack()
})

app.view('update_drupal_profile', async ({ ack, body, view }) => {
  await drupal.updateProfile(body.user.id, view.state.values)

  await ack()
})

app.view('update_wp_profile', async ({ ack, body, view }) => {
  await wp.updateProfile(body.user.id, view.state.values)

  await ack()
})

app.view('edit_profile', async ({ client, body, context, ack }) => {
  try {
    const result = await client.views.publish({
      token: context.botToken,
      user_id: body.user.id,
      view: {
        type: 'home',
        blocks: await home.view(body.user.id)
      }
    })
    console.log(result)
  } catch (error) {
    console.error(error)
  }
  await ack()
})

// Endpoints.
receiver.router.get('/config', (req, res) => configuration(res))
receiver.router.get('/profiles', (req, res, next) => profiles(req, res, next))
receiver.router.get('/jobs', async (req, res, next) => {
  const allJobs = await jobs.getJobs()
  res.send(jobs.apiFormat(allJobs))
})

export function handler(event, context) { return proxy(server, event, context) }
