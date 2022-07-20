import axios from 'axios'
import qs from 'qs'
const { stringify } = qs
import { default as NodeCache } from 'node-cache'
const cache = new NodeCache({ stdTTL: 600 })

export async function fetch(resource, method = 'get', data = null) {
  const creds = await getToken()
    .catch(() => {
      cache.del('BHRestToken')
      return getToken()
    })

  return axios({
    headers: { BhRestToken: creds.BhRestToken },
    method: method,
    url: creds.restUrl + resource,
    data: data,
  })
}

// Iterate queries to account for 500 record limit (200 record limit when
// querying skills).
export function depaginate(endpoint, params) {
  let allRecords = []

  async function doQuery(start) {
    if (start) params.start = start

    return await fetch(`${endpoint}?${stringify(params)}`)
      .then(res => {
        allRecords = allRecords.concat(res.data.data)
        return (allRecords.length < res.data.total) ? doQuery(allRecords.length) : allRecords
      })
      .catch(e => console.error(e))
  }

  return doQuery()
}

async function getToken() {
  if (cache.has('BHRestToken')) return cache.get('BHRestToken')

  const accessToken = await getAccessTokenFromRefreshToken()
    .catch(() => getAccessToken())

  return getRestToken(accessToken)
}

async function getAccessTokenFromRefreshToken() {
  const refreshToken = cache.get('BHRefreshToken')

  // Get access/refresh token.
  return axios.post(`https://auth.bullhornstaffing.com/oauth/token?grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${process.env.BH_CLIENT_ID}&client_secret=${process.env.BH_CLIENT_SECRET}`)
    .then(({ data }) => {
      // Store token.
      cache.set('BHRefreshToken', data.refresh_token)

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
      cache.set('BHRefreshToken', data.refresh_token)

      return data.access_token
    })
}

async function getRestToken(accessToken) {
  // Todo: This is a long-lived session token, so we can should store this (as well as the refresh token).
  // Get rest token.
  return axios.get(`https://rest.bullhornstaffing.com/rest-services/login?version=*&access_token=${accessToken}&ttl=999`)
    .then(({ data }) => {
      cache.set('BHRestToken', data)
      return data
    })
    .catch(err => console.error('Bullhorn login error: ', err.response.data))
}
