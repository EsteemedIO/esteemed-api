import '../util/config.js'
import bolt from '@slack/bolt'
const { App, ExpressReceiver } = bolt

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
})

const app = new App({
  token: process.env.SLACK_TOKEN_BOT,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver
})

import { addNote as addJobNote, getAll as getAllJobs } from '../models/jobs.js'
import { profiles } from '../models/profiles.js'
import { createInvoices, getPayPeriods } from '../models/invoice.js'

import commandProfile from '../slashCommands/profile.js'
import commandLatestProfiles from '../slashCommands/latestProfiles.js'
import * as jobs from '../slashCommands/job.js'

import defaultBlocks from '../blocks/profile.js'
import { modal as wpModal, updateProfile as updateWPProfile } from '../blocks/wp.js'
import { modal as drupalModal, updateProfile as updateDrupalProfile } from '../blocks/drupal.js'
import { modal as locationModal, update as updateLocation } from '../blocks/location.js'
import { view as viewHome } from '../blocks/home.js'
import { getForm as referralForm } from '../blocks/referrals.js'
import { invoicePeriods } from '../blocks/invoice.js'

import { countryOptions } from '../util/countryCodes.js'
import { setUserJoinDate, getUser, getProfile, loadUserProfile, updateProfile } from '../util/userProfiles.js'
import { set as setSlackFormData } from '../util/slackUtils.js'
import { getDetails as getResumeDetails, format as formatResume } from '../util/resume.js'
import { updateUserTasks } from '../util/tasks.js'

const isInternal = process.env.HOSTNAME ? process.env.HOSTNAME.startsWith('esteemed-api-internal') : false;

// Events.
app.event('app_home_opened', async ({ event, client }) => {
  try {
    const blocks = await viewHome(event.user)
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
  // Add user to Bullhorn.
  const bhId = await profiles.getBHIdByEmail(event.user.profile.email)

  if (!bhId) {
    setUserJoinDate(event.user, event.event_ts)
  }
  else {
    profiles.update(bhId, { slackId: event.user.id })
  }

  console.log('New user joined:', event.user.real_name)

  // Send welcome message.
  const message = `Welcome <@${event.user.id}>! We’re glad to have you with us. Our members would love to learn more about you! What’s your current role? Any <http://esteemed.io/jobs|specific jobs> you’re interested in applying for?\n\nTo join one (or more) of our many networks, hover over "Channels" tab, click the "+" symbol on the sidebar, and choose your channels (<#CUN3PEEAY>, <#C0377KRAMHR>, <#CSEHM34EN>, for example).\n\nAs a member of Colleagues, you have the opportunity to refer friends and earn up to $1500. <https://esteemed.io/member-compensation-plan/|Join our referral program here>.`

  app.client.chat.postMessage({
    token: process.env.SLACK_TOKEN_BOT,
    channel: 'CKP7Y4Q8M',
    text: message,
  })

  // Send direct welcome message 5 minutes after joining.
  const message_dm = `Hi <@${event.user.id}>! I'm <@UKBRBK1R9>, Founder and CEO of Esteemed. I thought I would use our Slack App to help get you started by clarifying a few things:\n
1. Slack is where everything happens here. If you are new to using it here is a link on <https://slack.com/help/articles/218080037-Getting-started-for-new-members|Getting Started>.
2. We are a company that operates as a community of people collaborating and helping one another reach our career goals. <https://www.beautiful.ai/player/-MWzS2GHu6tok07Ewigv|Learn more about us with this quick overview>, or take a look at <https://www.beautiful.ai/player/-N3uA5Olf7G15RmImPLC|our sales deck>.
3. As a Member of Colleagues you have the option of becoming a Talent Associate, if you're seeking work.
  • To do so, <https://youtu.be/0tH_R_MzDKs|please watch this video>, and make sure you have completed your Slack profile: Full Name, Email, and Phone Number.
  • After completing your profile, feel free to apply to any of our <https://esteemed.io/jobs|open jobs>.
  • Resource Managers and Screeners will be in touch to review your background, and provide advice for next steps.
4. We are a remote community. It really helps if you can include an image with your face so we can all get to know you. **We do not allow any company logos as profile picture, or using a company name as your handle**.
5. If you have any further questions, please feel free to reach out to <@U03JSTCSUFP> or <@U01L7SKKM6E>. They can help with almost anything.
We really appreciate you being here, and look forward to working with you!`

  await new Promise(r => setTimeout(r, 300000));

  app.client.chat.postMessage({
    token: process.env.SLACK_TOKEN_BOT,
    channel: event.user.id,
    text: message_dm,
  })
})

app.command('/invoice', async ({ command, ack, respond }) => {
  await ack()

  const profile = await getUser(command.user_id)

  if (profile.is_admin) {
    const blocks = {
      "blocks": [
        {
          "type": "input",
          "block_id": "invoice",
          "element": {
            "type": "static_select",
            "action_id": "period",
            "placeholder": {
              "type": "plain_text",
              "text": "Pick a pay period"
            },
            options: invoicePeriods(),
          },
          "label": {
            "type": "plain_text",
            "text": "Pay period",
            "emoji": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Preview invoicing"
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Preview",
            },
            "action_id": "preview_invoicing"
          }
        }
      ]
    }

    await respond(blocks)
      .catch(() => console.error('Invalid blocks'))
  }
})

app.command('/profile', async ({ command, ack, respond }) => {
  await ack()

  const userId = command.text.substring(2).split('|')[0]

  const profile = await commandProfile(userId)

  await respond(profile)

  console.log('Profile', userId, 'queried by', command.user_id)
})

app.command('/resume', async ({ command, ack, respond }) => {
  await ack()

  const userId = command.text.substring(2).split('|')[0]

  // Load user and see if file already exists.
  const profile = await getProfile(userId)

  if (profile.resume) {
    respond(profile.resume)
  }
  else {
    const slackProfile = await loadUserProfile(userId)
    let details = await getResumeDetails(userId)

    details.profile.image = slackProfile.profile.image_512

    const resumeUrl = await formatResume(details)

    // Update profile with resume URL.
    const bhId = await profiles.getBHId(userId)
    profiles.update(bhId, { resume: resumeUrl })

    console.log('Resume created for', userId)

    respond(resumeUrl)
  }
})

app.command('/referral-html', async ({ command, ack, respond }) => {
  await ack()

  respond({
    response_type: 'ephemeral',
    blocks: [{
      type: "section",
      text: {
        type: "mrkdwn",
        text: referralForm(command.user_id)
      }
    }]
  })
})

app.command('/profiles-latest', async ({ ack, command, respond }) => {
  await ack()

  const latestProfiles = await commandLatestProfiles(command.user_id)

  await respond(latestProfiles)

  console.log('Latest profiles queried by', command.user_id)
})

app.command('/jobs-list', async ({ ack, command, respond }) => {
  await ack()

  const jobs = await getAllJobs()
  const jobsAll = await jobs.listJobs(jobs, command.user_id)

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

if (isInternal) {
  app.command('/business-details', async ({ ack, respond }) => {
    await ack()

    respond({
      response_type: 'in_channel',
      blocks: [{
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Business Address*\nEsteemed, Inc\n5430 66TH Ave NW\nOlympia, WA, 98502-9664\n\n*Phone Number*\n+1 (360) 712-3866`
        }
      }]
    })
  })
}

// Actions.

app.action('preview_invoicing', async ({ ack, body }) => {
  await ack()

  const value = body.state.values.invoice.period.selected_option.value.split('-')[1];
  const selectedPeriod = getPayPeriods().find(period => period.id == value)

  const invoices = await createInvoices([
    selectedPeriod.startDate.toISOString().split('T')[0],
    selectedPeriod.endDate.toISOString().split('T')[0]
  ])

  app.client.chat.postMessage({
    token: process.env.SLACK_TOKEN_BOT,
    channel: body.container.channel_id,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Number of Invoices:* ${invoices.count}\n\n*Client Hours:*\n\n${invoices.hours.join("\n")}`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Generate invoices?"
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Generate",
          },
          "action_id": "generate_invoices",
          "value": value
        }
      }
    ]
  })
})

app.action('generate_invoices', async ({ ack, body }) => {
  await ack()

  const value = body.actions[0].value
  const selectedPeriod = getPayPeriods().find(period => period.id == value)

  await createInvoices([
    selectedPeriod.startDate.toISOString().split('T')[0],
    selectedPeriod.endDate.toISOString().split('T')[0]
  ], true)

  app.client.chat.postMessage({
    token: process.env.SLACK_TOKEN_BOT,
    channel: body.container.channel_id,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<https://app.qbo.intuit.com/app/invoices|Invoices generated>`
        }
      }
    ]
  })
})

app.action('edit_profile', async ({ action, ack, context, client, body }) => {
  await ack()

  const profile = await getProfile(body.user.id)
  const modal = setSlackFormData(await defaultBlocks(), profile)

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

  const modal = await drupalModal(body.user.id)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })

  console.log('Drupal profile form opened by user', body.user.id)
})

app.action({ block_id: 'wp_profile' }, async ({ context, client, body, ack }) => {
  await ack()

  const modal = await wpModal(body.user.id)

  const result = client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })

  console.log('WP profile form opened by user', body.user.id)
})

app.action('locality', async ({ context, client, body, ack }) => {
  await ack()

  const profile = await getProfile(body.user.id)
  const modal = locationModal(profile.location)

  const result = await client.views.open({
    token: context.botToken,
    trigger_id: body.trigger_id,
    view: modal
  })

  console.log('Location form opened by', body.user.id)
})

app.action('add_job_notes', async ({ action, ack, context, client, body }) => {
  await ack()

  // Check for user admin level.
  const profile = await getUser(body.user.id)

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

  updateProfile(body.user.id, action)

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
  await updateUserTasks(body.user.id, action.value)
  const blocks = await viewHome(body.user.id)

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
  const profile = await getUser(body.user.id)

  if (profile.is_admin) {
    await addJobNote(view.private_metadata, body.user.id, view.state.values.notes.val.value)
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
      blocks: await viewHome(body.user.id)
    }
  })
  updateLocation(body.user.id, view.state.values)

  console.log('Location data updated by user', body.user.id)
})

app.view('update_drupal_profile', async ({ ack, body, view }) => {
  await ack()

  await updateDrupalProfile(body.user.id, view.state.values)

  console.log('Drupal profile updated by user', body.user.id)
})

app.view('update_wp_profile', async ({ ack, body, view }) => {
  await ack()

  updateWPProfile(body.user.id, view.state.values)

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
        blocks: await viewHome(body.user.id)
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

export {
  app,
  receiver
}
