const crypto = require('crypto')
const qs = require('query-string')

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET

module.exports = (sig, body, timestamp) => {
  const time = Math.floor(new Date().getTime()/1000)

  if (Math.abs(time - timestamp) > 300) {
    return { statusCode: 400, body: 'Request timeout' }
  }

  if (!slackSigningSecret) {
    return { statusCode: 400, body: 'Slack signing secret is empty' }
  }

  const sigBasestring = 'v0:' + timestamp + ':' + body
  const mySig = 'v0=' + crypto.createHmac('sha256', slackSigningSecret).update(sigBasestring, 'utf8').digest('hex')

  if (crypto.timingSafeEqual(Buffer.from(mySig, 'utf8'), Buffer.from(sig, 'utf8'))) {
    return { statusCode: 200, body: '' }
  } else {
    return { statusCode: 400, body: 'Slack secret verification failed' }
  }
}
