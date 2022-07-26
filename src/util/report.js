import { leads } from '../models/leads.js'
import { loadChannelMembers, loadUsers, setUserJoinDate } from './userProfiles.js'
import fs from 'fs'
import { submissions } from '../models/jobSubmissions.js'
import { appointments } from '../models/appointments.js'
import placements from '../models/placements.js'
import { jobs as dbJobs, locationFormat } from '../models/jobs.js'
import { profiles } from '../models/profiles.js'
import opportunities from '../models/opportunities.js'

export default async function () {
  const now = new Date()
  const lastweek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  const lastweekQuery = lastweek.toLocaleString('en-ZA').replace(/[\/\s:,]/g, '')
  const lastweekSearch = lastweek.getTime()
  const currentQuery = now.toLocaleString('en-ZA').replace(/[\/\s:,]/g, '')
  const currentSearch = now.getTime()

  Promise.all([
    // Find new candidate count from the last week.
    contactsAdded(lastweekQuery, currentQuery),
    // Get all client submittals from the last week.
    clientSubmittals(lastweekQuery, currentQuery),
    // Find jobs added in the last week.
    jobsAdded(lastweekSearch, currentSearch),
    // Find interviews conducted in the last week.
    clientInterviews(lastweekSearch, currentSearch),
    // Find new hires from the last week.
    newHires(lastweekQuery, currentQuery),
    // Find new starts from the last week.
    newStarts(lastweekQuery, currentQuery),
    // Find opportunities added from the last week.
    opportunitiesAdded(lastweekSearch, currentSearch)
  ])
    .then(([
      contactsAdded,
      clientSubmittals,
      jobsAdded,
      clientInterviews,
      newHires,
      newStarts,
      opportunitiesAdded
    ]) => console.log({
      'Contacts Added': contactsAdded.length,
      'Client Submittals': clientSubmittals.length,
      'Jobs Added': jobsAdded.length,
      'Client Interviews': clientInterviews.length,
      'New Hires': newHires.length,
      'New Starts': newStarts.length,
      'New Opportunities': opportunitiesAdded.length,
    }))
}

function contactsAdded(lastweek, current) {
  return profiles.getAll({
      query: `isDeleted:FALSE AND dateAdded:[${lastweek} TO ${current}] AND customText10:[* TO *]`
    })
}

function clientSubmittals(lastweek, current) {
  return submissions.getAll({
      query: `isDeleted:FALSE AND dateAdded:[${lastweek} TO ${current}]`
    })
}

function jobsAdded(lastweek, current) {
  return dbJobs.getAll({
      where: `isOpen=TRUE AND isPublic=1 AND dateAdded > ${lastweek} AND dateAdded < ${current}`
    })
}

function clientInterviews(lastweek, current) {
  return appointments.getAll({
      where: `isDeleted=FALSE AND type='Interview' AND dateAdded > ${lastweek} AND dateAdded < ${current}`
    })
}

function newHires(lastweek, current) {
  return placements.getAll({
      query: `status:(Approved OR Completed OR Terminated) AND dateAdded:[${lastweek} TO ${current}]`
    })
}

function newStarts(lastweek, current) {
  return placements.getAll({
      query: `status:(Approved OR Completed OR Terminated) AND dateBegin:[${lastweek} TO ${current}]`
    })
}

function opportunitiesAdded(lastweek, current) {
  console.log(lastweek)
  return opportunities.getAll({
    where: `dateAdded > ${lastweek} AND dateAdded < ${current}`
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
