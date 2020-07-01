const express = require('express')
const serverless = require('serverless-http')
const cors = require('cors')
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
app.use(express.json())

app.get('/config', async (req, res) => res.json(configuration))
app.get('/profiles', async (req, res, next) => profiles(req, res, next))
app.get('/jobs', async (req, res, next) => jobs(res, next))
app.post('/dialog', verifyRequest, async (req, res, next) => profileDialog(req, res, next))
app.post('/slackEvents', verifyRequest, async (req, res, next) => slackEvents(req, res, next))
// @todo see if this needs verifyRequest.
app.post('/commandProfile', async (req, res, next) => commandProfile(req, res, next))
// @todo see if this needs verifyRequest.
app.post('/commandLatestProfiles', async (req, res, next) => commandLatestProfiles(req, res, next))

// Not Found
app.get('*', (req, res) => res.json({ msg: 'Path not valid' }))

module.exports.handler = serverless(app)
