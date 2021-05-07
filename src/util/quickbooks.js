import axios from 'axios'
import btoa from 'btoa'

import { profiles } from '../models/profiles.js'

// Development
//const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'

// Production
const baseUrl = 'https://quickbooks.api.intuit.com'

const basicAuth = btoa(`${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`)

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

async function getProjects() {
  const accessToken = await getToken()
  const params = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  }
  const selectStatement = "select * from Customer"

  return axios.get(`${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/query?query=${selectStatement}`, params)
    .then(({ data }) => {
      const customers = data.QueryResponse.Customer
      const jobs = customers.filter(customer => customer.Job)

      return jobs.map(job => {
        const parent = customers.find(customer => customer.Id == job.ParentRef.value)
        const email = parent.PrimaryEmailAddr ? parent.PrimaryEmailAddr.Address : ''
        return {
          id: job.Id,
          name: job.DisplayName,
          email: email
        }
      })
    })
    .catch(data => console.log(data))
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

export async function convertClockifyToQBInvoice(entries) {
  const projects = await getProjects()

  return Object.keys(entries).map(project => {
    const companyId = projects.find(i => i.name == company).id
    const CustomerRef = { value: companyId }
    const SalesTermRef = { value: 3, name: 'Net 30' }
    const BillEmail = { Address: project.email }

    const Line = entries[project].map(entry => {
      const hours = entry.timeInterval.duration / 60 / 60
      // TODO: Get actual billing rate.
      const price = 0
      return {
        Description: `[${entry.userName}] ${entry.description}`,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ServiceDate: entry.timeInterval.start,
          Qty: hours,
          UnitPrice: price,
          ItemRef: {
            name: 'Hours',
            value: 2
          },
        },
        Amount: hours * price,
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

export async function convertClockifyToQBBill(entries) {
  const companies = await getCompanies()

  return Promise.all(Object.keys(entries).map(async (email) => {
    const vendorId = await getVendor(email)
    const bhId = await profiles.getBHIdByEmail(email)
    const rates = await profiles.getRates(bhId)

    const VendorRef = { value: vendorId }
    const SalesTermRef = { value: 3, name: 'Net 30' }

    const Line = entries[email].map(entry => {
      const company = companies.find(i => i.name == entry.clientName)
      const hours = entry.timeInterval.duration / 60 / 60
      const price = rates.hourlyRate
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
        Amount: hours * price,
      }
    })

    return {
      SalesTermRef: SalesTermRef,
      VendorRef: VendorRef,
      Line: Line
    }
  }))
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

async function getToken() {
  const params = {
    headers: {
      'Authorization': `Basic ${basicAuth}`
    }
  }
  const body = `grant_type=refresh_token&refresh_token=${process.env.QBO_REFRESH_TOKEN}`

  return axios.post(`https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer`, body, params)
    .then(({ data }) => data.access_token)
    .catch(data => console.log(data))
}
