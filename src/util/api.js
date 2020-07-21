const axios = require('axios')

const baseUrl = 'https://slack.com/api'

module.exports.user = () => {
  const Api = axios.create({
    baseURL: baseUrl,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

  Api.interceptors.request.use(request => {
    request.params = { token: process.env.SLACK_TOKEN, ...request.params }

    return request
  })

  return Api
}

module.exports.bot = () => {
  const Api = axios.create({
    baseURL: baseUrl,
    headers: {
      Authorization: 'Bearer ' + process.env.SLACK_TOKEN_BOT,
      'Content-Type': 'application/json'
    }
  })

  Api.interceptors.request.use(request => {
    request.data = { token: process.env.SLACK_TOKEN_BOT, ...request.data }

    return request
  })

  return Api
}
