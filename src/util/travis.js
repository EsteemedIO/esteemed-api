const axios = require('axios')

module.exports = () => {
  const data = { request: { branch: 'develop' } }
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Travis-API-Version': '3',
    Authorization: 'token ' + process.env.TRAVIS_TOKEN
  }

  return axios.post('https://api.travis-ci.com/repo/WPContractors%2Fwpcontractors.github.io/requests', JSON.stringify(data), { headers: headers })
    .then(response => { console.log(response.data) })
    .catch((e) => { console.log('travisCI call failed: %o', e.response.data) })
}
