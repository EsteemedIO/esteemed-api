import axios from 'axios'
import { getToken } from '../util/quickbooks.js'
import { getHours, reduceEmails } from '../util/clockify.js'
import { profiles } from './profiles.js'
import placements from './placements.js'

// Development
//const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'

// Production
const baseUrl = 'https://quickbooks.api.intuit.com'

export async function createInvoices(dates) {
  // Create invoices.
  const projectHours = await getHours('projectName', dates)
  const emails = reduceEmails(projectHours)
  const projectPlacements = await placements.getAll()
    .then(p => p.filter(i => emails.includes(i.candidate.email)))
  const invoices = await convertClockifyToQBInvoice(projectHours, projectPlacements, dates[1])

  // Create invoices.
  batchInvoices(invoices)

  // Show invoices generated.
  createInvoiceReport(projectHours, invoices.length)
}

export function createInvoiceReport(projectHours, invoiceCount) {
  const clientHours = Object.keys(projectHours).reduce((acc, project) => {
    acc[project] = projectHours[project].reduce((acc, entry) => {
      acc += parseInt(entry.timeInterval.duration)
      return acc
    }, 0) / 60 / 60

    return acc
  }, {})

  const report = {
    'Number of Invoices: ': invoiceCount,
    'Client Hours: ': Object.keys(clientHours)
      .sort()
      .map(project => `${project}: ${clientHours[project].toFixed(2)}`)
  }
  console.log(report)
}

export async function createInvoice(hours) {
  const accessToken = await getToken()
  const params = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  }

  axios.post(`${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/invoice`, hours, params)
    .then(data => console.log(data))
    .catch(data => console.log(data.response.data.Fault.Error))
}

export async function batchInvoices(hours) {
  // QBO limits batch functions to 30 transactions.
  const batchCount = 30
  const accessToken = await getToken()
  const params = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  }

  for (let i = 0; i < hours.length; i += batchCount) {
    let batch = {
      BatchItemRequest: hours.slice(i, i + batchCount).map((invoice, index) => ({
        bId: `invoice${index}`,
        operation: 'create',
        Invoice: invoice
      }))
    }

    axios.post(`${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/batch`, batch, params)
      .then(({ data }) => console.log(data))
      .catch(data => console.log(data.response.data.Fault.Error))
  }
}

export async function createBill(hours) {
  const accessToken = await getToken()
  const params = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  }

  axios.post(`${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/bill`, hours, params)
    .then(data => console.log(data))
    .catch(data => console.log(data.response.data.Fault.Error))
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
        value: "Please include reference of invoice numbers paid with your payment.\n\nFor proper credit, please remit payment via ACH to:\nPNC Bank, NA, Checking account\nPaychex Advance LLC fbo Esteemed Inc\nAccount: 1029148695\nRouting: 043000096\n\nThis account receivable has been assigned to and is owned by or subject to security interest of Paychex Advance LLC, doing business as Advance Partners, and is payable only in United States Dollars"
      },
    }
  })
}

export async function convertClockifyToQBBill(entries, placements) {
  const companies = await getCompanies()

  return Promise.all(Object.keys(entries).map(async (email) => {
    const vendorId = await getVendor(email)
    const bhId = await profiles.getBHIdByEmail(email)

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

async function getProjects() {
  const accessToken = await getToken()
  const params = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  }
  const selectStatement = "select * from Customer MAXRESULTS 1000"

  return axios.get(`${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/query?query=${selectStatement}`, params)
    .then(({ data }) => {
      const customers = data.QueryResponse.Customer
      const jobs = customers.filter(customer => customer.Job)

      return jobs.map(job => {
        const parent = customers.find(customer => customer.Id == job.ParentRef.value)
        const email = parent.PrimaryEmailAddr ? parent.PrimaryEmailAddr.Address : ''
        const company = parent.DisplayName ? parent.DisplayName : job.DisplayName

        return {
          id: job.Id,
          project: job.DisplayName,
          company: company,
          email: email
        }
      })
    })
    .catch(response => console.log(response))
}

async function getCompanies() {
  const accessToken = await getToken()
  const params = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  }
  const selectStatement = "select * from Customer"

  return axios.get(`${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/query?query=${selectStatement}`, params)
    .then(({ data }) => data.QueryResponse.Customer)
    .then(customers => customers.map(customer => ({
      id: customer.Id,
      name: customer.CompanyName,
    })))
    .catch(data => console.log(data))
}

async function getVendor(email) {
  const accessToken = await getToken()
  const params = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  }
  const selectStatement = "select * from Vendor"

  return axios.get(`${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/query?query=${selectStatement}`, params)
    .then(({ data }) => data.QueryResponse.Vendor)
    .then(data => {
      const vendor = data.find(vendor => vendor.PrimaryEmailAddr ? vendor.PrimaryEmailAddr.Address == email : false)
      return vendor ? vendor.Id : false
    })
}
