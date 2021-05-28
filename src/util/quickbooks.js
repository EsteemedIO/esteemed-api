import axios from 'axios'
import btoa from 'btoa'
import { promises as fs } from 'fs'

const basicAuth = btoa(`${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`)
const tokenPath = '/tmp/quickbooks-token'

export async function getToken() {
  const params = {
    headers: {
      'Authorization': `Basic ${basicAuth}`
    }
  }

  // Check for existing token.
  const token = await fs.readFile(tokenPath, 'utf-8')
    .then(token => token.trim())
    .catch(() => false)

  // Prepare refresh token request.
  const body = `grant_type=refresh_token&refresh_token=${token}`

  return axios.post(`https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer`, body, params)
    .then(({ data }) => {
      // Store token with calculated expiration timestamp.
      fs.writeFile(tokenPath, data.refresh_token)

      return data.access_token
    })
    .catch(({ response }) => console.log(response.data))

}
