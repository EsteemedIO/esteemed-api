import axios from 'axios'
import { promises as fs } from 'fs'

const config = {
  headers: {
    'X-Api-Key': process.env.CLOCKIFY_TOKEN
  }
}

export async function getHours(filter, dates) {
  let allRecords = []

  // Set billing interval.
  const dateStart = `${dates[0]}T00:00:00.000Z`
  const dateEnd = `${dates[1]}T23:59:59.999Z`

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
  async function doQuery(page) {
    request.detailedFilter.page = page

    return axios.post(`https://reports.api.clockify.me/v1/workspaces/${process.env.CLOCKIFY_WORKSPACE}/reports/detailed`, request, config)
      .then(({ data }) => data.timeentries.filter(entry => entry.clientName != 'Internal (Esteemed Talent Inc.)'))
      .then(res => {
        allRecords = allRecords.concat(res)
        return res.length > 0 ? doQuery(++page) : allRecords
      })
      .catch(e => console.error(e))
  }

  return doQuery(1)
    .then(data => {
      return data.reduce(
        (objectsByKeyValue, obj) => ({
          ...objectsByKeyValue,
          [obj[filter]]: (objectsByKeyValue[obj[filter]] || []).concat(obj)
        }), {})
    })
    .catch(e => console.error(e))
}

export function reduceEmails(hours) {
  const emails = Object.keys(hours).flatMap(group => hours[group].flatMap(entry => entry.userEmail.toLowerCase()))

  return emails.filter((x, i) => i === emails.indexOf(x))
}
