const awsServerlessExpress = require('aws-serverless-express')
const { App, ExpressReceiver } = require('@slack/bolt')

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
})

const server = awsServerlessExpress.createServer(receiver.app)

const app = new App({
  token: process.env.SLACK_TOKEN_BOT,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver
})

const configuration = require('./configuration')
const profiles = require('./profiles')
const jobs = require('./jobs')
const commandProfile = require('./slashCommands/profile')
const commandLatestProfiles = require('./slashCommands/latestProfiles')
const setUserJoinDate = require('./event/setUserJoinDate')

const job = require('./slashCommands/job')
const profileHome = require('./event/profileHome')
const wp = require('./blocks/wp')
const drupal = require('./blocks/drupal')
const location = require('./blocks/location')

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

app.command('/dev-profile', async ({ command, ack, respond }) => {
  await ack()

  const profile = await commandProfile(command.text)

  await respond(profile)
})

app.command('/dev-profiles-latest', async ({ ack, command, respond }) => {
  await ack()

  const profiles = await commandLatestProfiles(command.user_id)

  await respond(profiles)
})

app.command('/dev-jobs-list', async ({ ack, command, respond }) => {
  // Acknowledge command request
  await ack()

  const jobs = await job.listJobs(command.user_id)

  await respond(jobs)
})

app.command('/dev-add-job', async ({ ack, command, context, client }) => {
  try {
    await ack()

    const jobForm = await job.addJobForm(command.user_id)

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
app.action({ block_id: 'drupal_profile' }, async ({ context, client, body, ack }) => {
  await ack()

  const modal = await drupal.modal(body.user.id)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })
  console.log(result)
})

// TODO
app.action({ callback_id: 'update_drupal_profile' }, async ({ action, ack }) => {
  await drupal.updateProfile(action)

  await ack()
})

app.action({ block_id: 'wp_profile' }, async ({ context, client, body, ack }) => {
  await ack()

  const modal = await wp.modal(body.user.id)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })
  console.log(result)
})

app.action({ block_id: 'locality' }, async ({ context, client, body, ack }) => {
  await ack()

  const modal = await location.modal()

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })
  console.log(result)
})

app.action('add_job', async ({ action, ack }) => {
  await job.addJob(action.submission)

  await ack()
})

app.action('edit_job', async ({ action, ack, context, client, body }) => {
  await ack()

  const jobForm = await job.editJobForm(action.value, body.user.id)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: jobForm
  })
  console.log(result)
})

app.action('add_job_notes', async ({ action, ack, context, client, body }) => {
  await ack()
  console.log(action)

  const jobNotesForm = await job.addJobNoteForm(action.value)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: jobNotesForm
  })
  console.log(result)
})

// TODO: confirm this working
app.action('apply_btn', async ({ action, ack, context, client, body }) => {
  await ack()

  const confirmForm = await job.confirmApplication(action.value)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: confirmForm
  })
  console.log(result)
})

app.action(/^(titles|skills|builders|languages|cms|date_available|availability|citizen|english)$/, async ({ ack, body, action, context, client }) => {
  await ack()

  await profileHome.update(body.user.id, action)

  const home = await profileHome.get(body.user.id)

  const result = await client.views.publish({
    token: context.botToken,
    user_id: body.user.id,
    view: home
  })
  console.log(result)
})

// Views submissions.
app.view('edit_job', async ({ ack, view }) => {
  await ack()

  console.log(view)
  await job.updateJob(view.private_metadata, view.state.values)
})

app.view('add_job_notes', async ({ ack, body, view }) => {
  await ack()

  await job.updateNotes(view.private_metadata, body.user.id, view.state.values)
})

app.view('confirm_app', async ({ ack, body, view }) => {
  await ack()

  await job.saveApplication(view.private_metadata, body.user.id)
})

app.view('update_location', async ({ ack, body, view, context, client }) => {
  await ack()

  await location.update(body.user.id, view.state.values.update_location.val.value)

  const home = await profileHome.get(body.user.id)

  const result = await client.views.publish({
    token: context.botToken,
    user_id: body.user.id,
    view: home
  })
  console.log(result)
})

app.view('update_drupal_profile', async ({ ack, body, view }) => {
  await drupal.updateProfile(body.user.id, view.state.values)

  await ack()
})

app.view('update_wp_profile', async ({ ack, body, view }) => {
  await ack()

  await wp.updateProfile(body.user.id, view.state.values)
})

// Endpoints.
receiver.router.get('/config', (req, res) => configuration(res))
receiver.router.get('/profiles', (req, res, next) => profiles(req, res, next))
receiver.router.get('/jobs', (req, res, next) => jobs(res, next))

module.exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context)
