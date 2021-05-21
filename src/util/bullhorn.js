import axios from 'axios'
import { promises as fs } from 'fs'

const bhTokenPath = '/tmp/bhtoken'

function getRestToken() {
  let cache = false;

  return async () => {
    if (!cache) {
      const refreshToken = await fs.readFile(bhTokenPath, 'utf-8')
        .then(token => token.trim())
        .catch(() => false)

      // Get access/refresh token.
      const token = await axios.post(`https://auth.bullhornstaffing.com/oauth/token?grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${process.env.BH_CLIENT_ID}&client_secret=${process.env.BH_CLIENT_SECRET}`)
        .then(({ data }) => data)
        .catch(err => console.error('Bullhorn accessToken error: ', err.response.data))

      // Store token.
      fs.writeFile(bhTokenPath, token.refresh_token)

      // Get rest token.
      cache = axios.get(`https://rest.bullhornstaffing.com/rest-services/login?version=*&access_token=${token.access_token}&ttl=999`)
        .then(({ data })=> data)
        .catch(err => console.error('Bullhorn login error: ', err.response.data))
    }

    return cache
  }
}

export async function fetch(resource, method = 'get', data = null) {
  const tokenClient = getRestToken()

  const creds = await tokenClient()

  return axios({
    headers: { BhRestToken: creds.BhRestToken },
    method: method,
    url: creds.restUrl + resource,
    data: data,
  })
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
