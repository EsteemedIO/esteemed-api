import axios from 'axios'
import { promises as fs } from 'fs'

const bhTokenPath = './bhtoken'

export async function fetch(resource, method = 'get', data = null) {
  const creds = await getToken()
  console.log(creds)

  return axios({
    headers: { BhRestToken: creds.BhRestToken },
    method: method,
    url: creds.restUrl + resource,
    data: data,
  })
}

async function getToken() {
  const accessToken = await getAccessTokenFromRefreshToken()
    .catch(() => getAccessToken())

  return getRestToken(accessToken)
}

async function getAccessTokenFromRefreshToken() {
  const refreshToken = await fs.readFile(bhTokenPath, 'utf-8')
    .then(token => token.trim())
    .catch(() => false)

  // Get access/refresh token.
  return axios.post(`https://auth.bullhornstaffing.com/oauth/token?grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${process.env.BH_CLIENT_ID}&client_secret=${process.env.BH_CLIENT_SECRET}`)
    .then(({ data }) => {
      // Store token.
      fs.writeFile(bhTokenPath, data.refresh_token)

      return data.access_token
    })
}

async function getAccessToken() {
  const authorizationCode = await axios.post(`https://auth.bullhornstaffing.com/oauth/authorize?response_type=code&client_id=${process.env.BH_CLIENT_ID}&action=Login&username=${process.env.BH_CLIENT_USERNAME}&password=${process.env.BH_CLIENT_PASSWORD}`)
    .then(response => response.request.res.responseUrl.split('code=')[1].split('&')[0])
    .catch(err => console.error('Bullhorn authCode error: ', err.response.data))

  return axios.post(`https://auth.bullhornstaffing.com/oauth/token?grant_type=authorization_code&code=${authorizationCode}&client_id=${process.env.BH_CLIENT_ID}&client_secret=${process.env.BH_CLIENT_SECRET}`)
    .then(({ data }) => {
      // Store token.
      fs.writeFile(bhTokenPath, data.refresh_token)

      return data.access_token
    })
}

async function getRestToken(accessToken) {
  // Todo: This is a long-lived session token, so we can should store this (as well as the refresh token).
  // Get rest token.
  return axios.get(`https://rest.bullhornstaffing.com/rest-services/login?version=*&access_token=${accessToken}&ttl=999`)
    .then(({ data }) => data)
    .catch(err => console.error('Bullhorn login error: ', err.response.data))
}

export function reassignBHValues(fields, values) {
  return Object.keys(values).reduce((acc, key) => {
    if (fields[key] != null) {
      acc[fields[key]] = values[key]
    }

    return acc
  }, {})
}

export function reassignSlackValues(fields, values) {
  return Object.keys(values).reduce((acc, key) => {
      const mappedKey = Object.keys(fields).find(field => fields[field] == key)
      if (key == 'date_available') {
        const [year, month, day] = values[key].split('-')
        acc[mappedKey] = new Date(year, month - 1, day).getTime()
      }
      else {
        acc[mappedKey] = values[key]
      }

      return acc
    }, {})
}
