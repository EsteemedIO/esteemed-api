import { getProjects, getCompanies, getVendor } from './quickbooks.js'
import { reduceEmails, getHoursSortByKey } from '../util/clockify.js'
import placements from './placements.js'

export async function createInvoices(dates, create = false) {
  // Create invoices.
  const projectHours = await getHoursSortByKey('projectName', dates)
  const emails = reduceEmails(projectHours)
  const projectPlacements = await placements.getAll()
    .then(p => p.filter(i => emails.includes(i.candidate.email)))
  const invoices = await convertClockifyToQBInvoice(projectHours, projectPlacements, dates[1])

  // Create invoices.
  if (create) {
    batchInvoices(invoices)
  }

  // Show invoices generated.
  return createInvoiceReport(projectHours, invoices.length)
}

export function createInvoiceReport(projectHours, invoiceCount) {
  const clientHours = Object.keys(projectHours).reduce((acc, project) => {
    acc[project] = projectHours[project].reduce((acc, entry) => {
      acc += parseInt(entry.timeInterval.duration)
      return acc
    }, 0) / 60 / 60

    return acc
  }, {})

  return {
    'count': invoiceCount,
    'hours': Object.keys(clientHours)
      .sort()
      .map(project => `${project}: ${clientHours[project].toFixed(2)}`)
  }
}

export async function convertClockifyToQBInvoice(entries, placements, invoiceDate) {
  const projects = await getProjects()

  // Iterate over each project array.
  return Object.keys(entries).map(project => {
    const company = projects.find(i => i.project == project)

    if (company === undefined) {
      console.dir(`Project missing from QBO: ${project}`)
    }

    const CustomerRef = { value: company.id }
    const SalesTermRef = { value: 3, name: 'Net 30' }
    const BillEmail = { Address: project.email }

    // Separate project entries by candidate.
    const candidateEntries = entries[project].reduce((acc, entry) => {
      (acc[entry.userEmail] = acc[entry.userEmail] || []).push(entry)

      return acc
    }, {})

    // Sum hours for each candidate.
    const hours = Object.keys(candidateEntries).reduce((acc, candidate) => {
      acc[candidate] = candidateEntries[candidate].reduce((acc, entry) => {
        acc += parseInt(entry.timeInterval.duration)
        return acc
      }, 0) / 60 / 60

      return acc
    }, {})

    // Iterate over each entry in a project.
    const Line = Object.keys(hours).map(email => {
      // Get candidate details for this line item.
      const placementDetails = placements.find(placement => {
        return placement.candidate.email == email && placement.jobOrder.clientCorporation.name == company.company
      })

      // Log placements not found.
      if (placementDetails == undefined) {
        console.dir(`Placement not found: ${email} at ${company.company}`)
        return
      }

      return {
        Description: `${placementDetails.candidate.firstName} ${placementDetails.candidate.lastName}`,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          Qty: hours[email],
          UnitPrice: placementDetails.clientBillRate,
          ItemRef: {
            name: 'Hours',
            value: 2
          },
        },
        Amount: hours[email] * placementDetails.clientBillRate,
      }
    })

    return {
      TxnDate: invoiceDate,
      BillEmail: BillEmail,
      SalesTermRef: SalesTermRef,
      CustomerRef: CustomerRef,
      Line: Line,
      CustomerMemo: {
        value: "Please include reference of invoice numbers paid with your payment.\n\nFor proper credit, please remit payment via ACH to:\nPNC Bank, NA, Checking account\nPaychex Advance LLC fbo Esteemed Inc\nAccount: 1029148695\nRouting: 043000096\n\nFor Paper Checks:\nAP FBO Esteemed Inc.\nPO BOX 31001-2434\nPasadena, CA 91110-2434\n\nThis account receivable has been assigned to and is owned by or subject to security interest of Paychex Advance LLC, doing business as Advance Partners, and is payable only in United States Dollars"
      },
    }
  })
}

export async function convertClockifyToQBBill(entries, placements) {
  const companies = await getCompanies()

  return Promise.all(Object.keys(entries).map(async (email) => {
    const vendorId = await getVendor(email)

    const VendorRef = { value: vendorId }
    const SalesTermRef = { value: 3, name: 'Net 30' }

    // Get placement details.
    const placementDetails = placements.filter(placement => placement.candidate.email == entry.userEmail)

    const Line = entries[email].map(entry => {
      const company = companies.find(i => i.name == entry.clientName)
      const hours = entry.timeInterval.duration / 60 / 60

      // Filter entries to list rates pertinent to this line item.
      const placement = placementDetails.find(detail => {
        return detail.jobOrder.clientCorporation.name == entry.clientCorporation && detail.jobOrder.clientCorporation == entry.clientName
      })

      return {
        Description: `[${entry.userName}] ${entry.description}`,
        DetailType: 'AccountBasedExpenseLineDetail',
        AccountBasedExpenseLineDetail: {
          AccountRef: {
            name: 'Contractors',
            value: 7
          },
          BillableStatus: 'Billable',
          CustomerRef: {
            name: company.name,
            value: company.id
          }
        },
        Amount: hours * placement.payRate
      }
    })

    return {
      SalesTermRef: SalesTermRef,
      VendorRef: VendorRef,
      Line: Line
    }
  }))
}

export function getPayPeriods() {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const priorMonthCount = currentDate.getMonth()
  const currentDay = currentDate.getDate()

  // Get date ranges for prior months.
  let dates = [...Array(priorMonthCount)].flatMap((_, i) => [
      {
        id: i * 2,
        startDate: new Date(currentYear, i, 1),
        endDate: new Date(currentYear, i, 15),
      },
      {
        id: (i * 2) + 1,
        startDate: new Date(currentYear, i, 16),
        endDate: new Date(currentYear, i + 1, 0),
      }
    ])

  dates = [...dates, {
      id: dates.length,
      startDate: new Date(currentYear, priorMonthCount, 1),
      endDate: new Date(currentYear, priorMonthCount, 15),
  }]

  if (currentDay > 15) {
    dates = [...dates, {
        id: dates.length + 1,
        startDate: new Date(currentYear, priorMonthCount, 16),
        endDate: new Date(currentYear, priorMonthCount, 0),
    }];
  }

  return dates.sort((a, b) => b.id - a.id);
}
