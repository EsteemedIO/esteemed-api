const verifyRequest = require('./verifyRequest')
const getProfileHome = require('./event/getProfileHome')
const setUserJoinDate = require('./event/setUserJoinDate')

module.exports = async (req, res, next) => {
  try {
    const body = JSON.parse(req.body)
    const payload = body.event
    const slackSignature = req.headers['X-Slack-Signature']
    const timestamp = req.headers['X-Slack-Request-Timestamp']
    const verified = verifyRequest(slackSignature, event.body, timestamp)

    // Verify domain with Slack.
    if (body.challenge) {
      res.send(JSON.parse(event.body).challenge)
    }

    // Return errors if request validation fails.
    if (verified.statusCode == 400) next(verified.body)

    if (payload.type && payload.type == 'app_home_opened') {
      res.send(getProfileHome(payload.user))
    }
    else if (payload.type && payload.type == 'team_join') {
      res.send(setUserJoinDate(payload.user))
    }
  } catch (e) {
    console.log(e)
    next(e)
  }
}
