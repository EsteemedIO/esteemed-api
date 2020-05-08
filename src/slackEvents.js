const axios = require('axios')
const qs = require('query-string')
const url = require('url')

const verifyRequest = require('./verifyRequest')
const getProfileHome = require('./event/getProfileHome')

exports.handler = async event => {
  try {
    const body = JSON.parse(event.body)
    const payload = body.event
    const slackSignature = event.headers['X-Slack-Signature']
    const timestamp = event.headers['X-Slack-Request-Timestamp']
    const verified = await verifyRequest(slackSignature, event.body, timestamp)

    // Verify domain with Slack.
    if (body.challenge) {
      return { statusCode: 200, body: JSON.parse(event.body).challenge }
    }

    // Return errors if request validation fails.
    if (verified.statusCode == 400) return verified

    if (payload.type && payload.type == 'app_home_opened') {
      return await getProfileHome(payload.user)
    }
  } catch (e) {
    console.log(e)
    return {
      statusCode: 400,
      body: JSON.stringify(e)
    }
  }
}
