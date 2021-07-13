import axios from 'axios'
import { getToken } from '../util/quickbooks.js'
import { profiles } from './profiles.js'

// Development
//const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'

// Production
const baseUrl = 'https://quickbooks.api.intuit.com'

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

export async function convertClockifyToQBInvoice(entries, placements) {
  const projects = await getProjects()

  // Iterate over each project array.
  return Object.keys(entries).map(project => {
    const company = projects.find(i => i.project == project)
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
      BillEmail: BillEmail,
      SalesTermRef: SalesTermRef,
      CustomerRef: CustomerRef,
      Line: Line
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
