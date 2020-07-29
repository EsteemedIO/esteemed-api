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
import jobs from './jobs'
import commandProfile from './slashCommands/profile'
import commandLatestProfiles from './slashCommands/latestProfiles'
import setUserJoinDate from './event/setUserJoinDate'

import { listJobs, addJobForm, addJob, editJobForm, addJobNoteForm, confirmApplication, updateJob, updateNotes, saveApplication } from './slashCommands/job'
import * as profileHome from './event/profileHome'
import * as wp from './blocks/wp'
import * as drupal from './blocks/drupal'
import * as location from './blocks/location'

// Events.
app.event('app_home_opened', async ({ event, context, client }) => {
  try {
    const home = await profileHome.get(event.user)

    const result = await client.views.publish({
      token: context.botToken,
      user_id: event.user,
      view: home
    })
    console.log(result)
  } catch (error) {
    console.error(error)
  }
})

app.event('team_join', async ({ context }) => {
  try {
    await setUserJoinDate(context.user)
  } catch (error) {
    console.error(error)
  }
})

app.command('/profile', async ({ command, ack, respond }) => {
  const profile = await commandProfile(command.text)

  await respond(profile)

  await ack()
})

app.command('/profiles-latest', async ({ ack, command, respond }) => {
  const profiles = await commandLatestProfiles(command.user_id)

  await respond(profiles)

  await ack()
})

app.command('/jobs-list', async ({ ack, command, respond }) => {
  const jobs = await listJobs(command.user_id)

  await respond(jobs)

  await ack()
})

app.command('/add-job', async ({ ack, command, context, client }) => {
  try {
    const jobForm = await addJobForm(command.user_id)

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

app.action({ block_id: 'locality' }, async ({ context, client, body, ack }) => {
  const modal = await location.modal()

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })
  console.log(result)

  await ack()
})

app.action('add_job', async ({ action, ack }) => {
  await job.addJob(action.submission)

  await ack()
})

app.action('edit_job', async ({ action, ack, context, client, body }) => {
  const jobForm = await editJobForm(action.value, body.user.id)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: jobForm
  })
  console.log(result)

  await ack()
})

app.action('add_job_notes', async ({ action, ack, context, client, body }) => {
  const jobNotesForm = await addJobNoteForm(action.value)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: jobNotesForm
  })
  console.log(result)

  await ack()
})

// TODO: confirm this working
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
  await profileHome.update(body.user.id, action)

  const home = await profileHome.get(body.user.id)

  const result = await client.views.publish({
    token: context.botToken,
    user_id: body.user.id,
    view: home
  })
  console.log(result)

  await ack()
})

// Views submissions.
app.view('edit_job', async ({ ack, view }) => {
  await updateJob(view.private_metadata, view.state.values)

  await ack()
})

app.view('add_job_notes', async ({ ack, body, view }) => {
  await updateNotes(view.private_metadata, body.user.id, view.state.values)

  await ack()
})

app.view('confirm_app', async ({ ack, body, view }) => {
  await saveApplication(view.private_metadata, body.user.id)

  await ack()
})

app.view('update_location', async ({ ack, body, view, context, client }) => {
  await location.update(body.user.id, view.state.values.update_location.val.value)

  const home = await profileHome.get(body.user.id)

  const result = await client.views.publish({
    token: context.botToken,
    user_id: body.user.id,
    view: home
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

// Endpoints.
receiver.router.get('/config', (req, res) => configuration(res))
receiver.router.get('/profiles', (req, res, next) => profiles(req, res, next))
receiver.router.get('/jobs', (req, res, next) => jobs(res, next))

export function handler(event, context) { return proxy(server, event, context) }
