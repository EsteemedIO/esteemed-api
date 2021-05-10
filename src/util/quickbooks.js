import axios from 'axios'
import btoa from 'btoa'

const basicAuth = btoa(`${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`)

export async function getToken() {
  const params = {
    headers: {
      'Authorization': `Basic ${basicAuth}`
    }
  }
  const body = `grant_type=refresh_token&refresh_token=${process.env.QBO_REFRESH_TOKEN}`

  return axios.post(`https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer`, body, params)
    .then(({ data }) => data.access_token)
    .catch(data => console.log(data))
}
