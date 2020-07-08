const express = require('express')
const cors = require('cors')
const serverless = require('serverless-http')

const app = express()
const configuration = require('./configuration')
const profiles = require('./profiles')
const jobs = require('./jobs')
const profileDialog = require('./profileDialog')
const slackEvents = require('./slackEvents')
const commandProfile = require('./slashCommands/profile')
const commandLatestProfiles = require('./slashCommands/latestProfiles')
const verifyRequest = require('./verifyRequest')

app.use(cors())
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('statusCode', 200)
  next()
})
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Log calling function.
app.use((req, res, next) => {
  console.log('Called endpoint: ', req.url)

  next()
})

// Endpoints.
app.get('/config', async (req, res) => configuration(res))
app.get('/profiles', async (req, res, next) => profiles(req, res, next))
app.get('/jobs', async (req, res, next) => jobs(res, next))
app.post('/dialog', async (req, res, next) => profileDialog(req, res, next))
app.post('/slackEvents', async (req, res, next) => slackEvents(req, res, next))
// @todo see if this needs verifyRequest.
app.post('/commandProfile', async (req, res, next) => commandProfile(req, res, next))
// @todo see if this needs verifyRequest.
app.post('/commandLatestProfiles', async (req, res, next) => commandLatestProfiles(req, res, next))

// Not Found
app.get('*', (req, res) => res.json({ msg: 'Path not valid' }))

module.exports.handler = serverless(app)
