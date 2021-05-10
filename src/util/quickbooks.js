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

  // Prepare access token request (this should only happen once).
  let body = `grant_type=authorization_code&code=${process.env.QBO_AUTH_CODE}&redirect_uri=https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl`

  // Check for existing token.
  const token = await fs.readFile(tokenPath, 'utf-8')
    .then(token => JSON.parse(token))
    .catch(() => false)

  if (token && token.expire_date > Math.floor(Date.now() / 1000)) {
    // Check if refresh token is expired.
    return token.access_token
  }
  else if (token) {
    // Prepare refresh token request.
    body = `grant_type=refresh_token&refresh_token=${token.refresh_token}`
  }

  return axios.post(`https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer`, body, params)
    .then(({ data }) => {
      // Store token with calculated expiration timestamp.
      fs.writeFile(tokenPath, JSON.stringify({
        ...data,
        expire_date: Math.floor(Date.now() / 1000) + data.x_refresh_token_expires_in
      }))

      return data.access_token
    })
    .catch(data => console.log(data))

}
