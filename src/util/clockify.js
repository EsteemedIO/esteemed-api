import axios from 'axios'

const config = {
  headers: {
    'X-Api-Key': process.env.CLOCKIFY_TOKEN
  }
}

// Set billing interval.
const period = 14

const date = new Date()
const dateEnd = date.toISOString()

date.setDate(date.getDate() - period)
const dateStart = date.toISOString()

export async function getHours() {
  const request = {
    "dateRangeStart": dateStart,
    "dateRangeEnd": dateEnd,
    "detailedFilter": {
      "page": 1,
      "pageSize": 200,
      "sortColumn": "DATE",
    },
    "sortOrder": "DESCENDING",
    "exportType": "JSON",
    "amountShown": "EARNED",
    "timeZone": "America/New_York",
    "billable": true,
  }

  // Get hour report for the last 2 weeks.
  return axios.post(`https://reports.api.clockify.me/v1/workspaces/${process.env.CLOCKIFY_WORKSPACE}/reports/detailed`, request, config)
    .then(({ data }) => data.timeentries.reduce(
      (objectsByKeyValue, obj) => ({
        ...objectsByKeyValue,
        [obj['clientName']]: (objectsByKeyValue[obj['clientName']] || []).concat(obj)
      }), {}))
    .catch(e => console.error(e))
}
