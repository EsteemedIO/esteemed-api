import { leads } from '../models/leads.js'
import { loadChannelMembers, loadUsers, setUserJoinDate } from './userProfiles.js'
import fs from 'fs'
import { submissions } from '../models/jobSubmissions.js'
import { appointments } from '../models/appointments.js'
import placements from '../models/placements.js'
import { jobs as dbJobs, locationFormat } from '../models/jobs.js'
import { profiles } from '../models/profiles.js'
import opportunities from '../models/opportunities.js'

export default async function (start, end) {
  const startQuery = start.toLocaleString('en-ZA').replace(/[\/\s:,]/g, '')
  const startSearch = start.getTime()
  const endQuery = end.toLocaleString('en-ZA').replace(/[\/\s:,]/g, '')
  const endSearch = end.getTime()

  return Promise.all([
    // Find new candidate count from the last week.
    contactsAdded(startQuery, endQuery),
    // Get all client submittals from the last week.
    clientSubmittals(startQuery, endQuery),
    // Find jobs added in the last week.
    jobsAdded(startSearch, endSearch),
    // Find interviews conducted in the last week.
    clientInterviews(startSearch, endSearch),
    // Find new hires from the last week.
    newHires(startQuery, endQuery),
    // Find new starts from the last week.
    newStarts(startQuery, endQuery),
    // Find opportunities added from the last week.
    opportunitiesAdded(startSearch, endSearch)
  ])
    .then(([
      contactsAdded,
      clientSubmittals,
      jobsAdded,
      clientInterviews,
      newHires,
      newStarts,
      opportunitiesAdded
    ]) => ({
      '🙋 Contacts Added': contactsAdded.length,
      '👌 Client Submittals': clientSubmittals.length,
      '👨‍💻 Jobs Added': jobsAdded.length,
      '💼 Client Interviews': clientInterviews.length,
      '🤝 New Hires': newHires.length,
      '🎬 New Starts': newStarts.length,
      '🤝 New Opportunities': opportunitiesAdded.length,
    }))
}

function contactsAdded(start, end) {
  return profiles.getAll({
      query: `isDeleted:FALSE AND dateAdded:[${start} TO ${end}] AND customText10:[* TO *]`
    })
}

function clientSubmittals(start, end) {
  return submissions.getAll({
      query: `isDeleted:FALSE AND dateAdded:[${start} TO ${end}]`
    })
}

function jobsAdded(start, end) {
  return dbJobs.getAll({
      where: `isOpen=TRUE AND isPublic=1 AND dateAdded > ${start} AND dateAdded < ${end}`
    })
}

function clientInterviews(start, end) {
  return appointments.getAll({
      where: `isDeleted=FALSE AND type='Interview' AND dateAdded > ${start} AND dateAdded < ${end}`
    })
}

function newHires(start, end) {
  return placements.getAll({
      query: `status:(Approved OR Completed OR Terminated) AND dateAdded:[${start} TO ${end}]`
    })
}

function newStarts(start, end) {
  return placements.getAll({
      query: `status:(Approved OR Completed OR Terminated) AND dateBegin:[${start} TO ${end}]`
    })
}

function opportunitiesAdded(start, end) {
  return opportunities.getAll({
    where: `dateAdded > ${start} AND dateAdded < ${end}`
  })
}

//Find developers not in Slack.
function notInSlack() {
  return profiles.getAll({
      query: 'isDeleted:FALSE AND -customText10:[* TO *]'
    })
}

function writeToCsv(data) {
//    .then(profiles => profiles.map(p => `${p.firstName},${p.lastName},${p.email},${new Intl.DateTimeFormat('en-US').format(new Date(p.dateAdded))},${p.location.city},${p.location.state}`).join("\n"))
  fs.writeFile('data.csv', data, 'utf8', function(err) {
    if (err) {
      console.log('Some error occured - file either not saved or corrupted file saved.');
    } else {
      console.log('It\'s saved!');
    }
  })
}
