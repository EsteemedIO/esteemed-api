const getProfileHome = require('./event/getProfileHome')
const setUserJoinDate = require('./event/setUserJoinDate')

module.exports = async (req, res, next) => {
  try {
    // Verify domain with Slack.
    if (req.body.challenge) {
      res.send(req.body.challenge)
    }

    if (req.body.event.type && req.body.event.type === 'app_home_opened') {
      await getProfileHome(req.body.event.user)
      res.send()
    } else if (req.body.event.type && req.body.event.type === 'team_join') {
      await setUserJoinDate(req.body.event.user)
      res.send()
    }
  } catch (e) {
    console.log(e)
    next(e)
  }
}
