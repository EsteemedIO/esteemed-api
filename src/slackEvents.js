const getProfileHome = require('./event/getProfileHome')
const setUserJoinDate = require('./event/setUserJoinDate')

module.exports = async (req, res, next) => {
  try {

    // Verify domain with Slack.
    if (req.body.challenge) {
      res.send(JSON.parse(event.body).challenge)
    }

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
