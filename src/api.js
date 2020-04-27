const axios = require('axios')

const baseUrl = 'https://slack.com/api'

module.exports = () => {

  const Api = axios.create({
    baseURL: baseUrl,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

  Api.interceptors.request.use(async request => {
    request.params = { token: process.env.SLACK_TOKEN, ...request.params }

    return request
  })

  return Api
}

