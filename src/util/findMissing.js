import { getHours, getUsers as getClockifyUsers, getProjects as getClockifyProjects, getHoursSortByKey } from './clockify.js'
import placements from '../models/placements.js'
import { getPayPeriods, getProjects } from '../models/invoice.js'

// Report a list of projects missing from QBO.
export async function findMissingProjects() {
  const { startDate, endDate } = getPayPeriods()[0]
  const dates = [
    startDate.toLocaleString('en-ZA').split(',')[0].replace(/\//g,'-'),
    endDate.toLocaleString('en-ZA').split(',')[0].replace(/\//g,'-')
  ]
  const projects = await getProjects()
  const entries = await getHoursSortByKey('projectName', dates)

  let missing_projects = []
  Object.keys(entries).map(project => {
    const company = projects.find(i => i.project == project)

    if (company === undefined) {
      missing_projects.push(`Project missing from QBO: ${project}`)
    }
  })

  return missing_projects
}

// Report a list of placements missing from Bullhorn.
export async function findMissingPlacements() {
  // Get a list of emails with current hours logged.
  const { startDate, endDate } = getPayPeriods()[0]
  const dates = [
    startDate.toLocaleString('en-ZA').split(',')[0].replace(/\//g,'-'),
    endDate.toLocaleString('en-ZA').split(',')[0].replace(/\//g,'-')
  ]
  const projectHours = await getHours(dates)

  const emailsWithHours = [...new Set(projectHours.map(h => ({
      email: h.userEmail,
      projectId: h.projectId
  })))]

  // Get list of Clockify emails and associated projects within given previous set.
  const clockifyData = await Promise.all([ getClockifyProjects(), getClockifyUsers() ])
    .then(([ projects, users ]) => projects
      // Filter out projects without hours.
      .filter(p => emailsWithHours.find(e => e.projectId === p.id))
      .map(p => ({
        project: p.name,
        emails: p.memberships
          .map(m => users.find(u => u.id == m.userId).email)
          // Filter out users without hours.
          .filter(e => emailsWithHours.some(f => f.email === e))
      }))
      .filter(p => p.emails.length > 0)
    )

  // Get listed placements in Bullhorn.
  const bullhornData = await placements.getAll()
    .then(placements => placements.map(placement => ({
      project: placement.jobOrder.clientCorporation.name,
      email: placement.candidate.email
    })))

  // Find users with entries in Clockify that are missing in Bullhorn.
  let bullhornMissing = []
  clockifyData.map(c => c.emails.map(email => {
    const found = bullhornData.find(b => b.project == c.project && b.email == email)
    if (found === undefined) {
      bullhornMissing.push({ project: c.project, email: email })
    }
  }))

  // Return missing placements, filtering out internal projects.
  return bullhornMissing
    .filter(p => p.project !== 'DIGITAL - Internal')
}
