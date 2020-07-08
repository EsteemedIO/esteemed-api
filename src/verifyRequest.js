const crypto = require('crypto')

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET

module.exports = (req, res, next) => {
  const slackSignature = req.header('X-Slack-Signature')
  const timestamp = req.header('X-Slack-Request-Timestamp')

  const time = Math.floor(new Date().getTime()/1000)

  if (Math.abs(time - timestamp) > 300) {
    next('Request timeout')
  }

  if (!slackSigningSecret) {
    next('Slack signing secret is empty')
  }

  const sigBasestring = 'v0:' + timestamp + ':' + qs.stringify(req.body,{ format:'RFC1738' })
  const mySig = 'v0=' + crypto.createHmac('sha256', slackSigningSecret).update(sigBasestring, 'utf8').digest('hex')

  if (crypto.timingSafeEqual(Buffer.from(mySig, 'utf8'), Buffer.from(slackSignature, 'utf8'))) {
    res.send()
  } else {
    next('Slack secret verification failed')
  }
}
