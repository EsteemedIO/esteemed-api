import axios from 'axios'

const credentials = {
  client_id: process.env.BH_CLIENT_ID,
  client_secret: process.env.BH_CLIENT_SECRET,
  username: process.env.BH_CLIENT_USERNAME,
  password: process.env.BH_CLIENT_PASSWORD,
  restLoginUrl: 'https://rest.bullhornstaffing.com/rest-services/login',
  tokenHost: 'https://auth.bullhornstaffing.com',
}

async function getRestToken() {
  const authorizationCode = await axios.post(`${credentials.tokenHost}/oauth/authorize?response_type=code&client_id=${credentials.client_id}&action=Login&username=${credentials.username}&password=${credentials.password}`)
    .then(response => response.request.res.responseUrl.split('code=')[1].split('&')[0])

  const accessToken = await axios.post(`${credentials.tokenHost}/oauth/token?grant_type=authorization_code&code=${authorizationCode}&client_id=${credentials.client_id}&client_secret=${credentials.client_secret}`)
    .then(res => res.data.access_token)

  return axios.get(`${credentials.restLoginUrl}?version=*&access_token=${accessToken}&ttl=999`)
    .then(res => res.data)
}

export async function fetch(resource, method = 'get', data = null) {
  const creds = await getRestToken()

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
