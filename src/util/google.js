import axios from 'axios'
import { default as googleapis } from 'googleapis'

export async function authenticate() {
  const token = await get_access_token()
  const oauth2Client = new googleapis.google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  )

  oauth2Client.setCredentials({ access_token: token })

  googleapis.google.options({ auth: oauth2Client })
}

async function get_access_token() {
  const refresh_token = process.env.GOOGLE_REFRESH_TOKEN
  const client_id = process.env.GOOGLE_CLIENT_ID
  const client_secret = process.env.GOOGLE_CLIENT_SECRET
  const refresh_url = "https://www.googleapis.com/oauth2/v4/token"
  const post_body = `grant_type=refresh_token&client_id=${encodeURIComponent(client_id)}&client_secret=${encodeURIComponent(client_secret)}&refresh_token=${encodeURIComponent(refresh_token)}`

  return axios.post(refresh_url, post_body, { headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
    .then(response => response.data.access_token)
}
