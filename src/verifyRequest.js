const crypto = require('crypto')

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET

module.exports = (req, res, next) => {
  const body = JSON.parse(req.body)
  const slackSignature = req.headers['X-Slack-Signature']
  const timestamp = req.headers['X-Slack-Request-Timestamp']

  const time = Math.floor(new Date().getTime()/1000)

  if (Math.abs(time - timestamp) > 300) {
    next('Request timeout')
  }

  if (!slackSigningSecret) {
    next('Slack signing secret is empty')
  }

  const sigBasestring = 'v0:' + timestamp + ':' + req.body
  const mySig = 'v0=' + crypto.createHmac('sha256', slackSigningSecret).update(sigBasestring, 'utf8').digest('hex')

  if (crypto.timingSafeEqual(Buffer.from(mySig, 'utf8'), Buffer.from(slackSignature, 'utf8'))) {
    res.send()
  } else {
    next('Slack secret verification failed')
  }
}
