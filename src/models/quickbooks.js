import oAuthClient from 'intuit-oauth'
import flatCache from 'flat-cache'

// Development
//const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'

// Production
const baseUrl = 'https://quickbooks.api.intuit.com'

const qboClient = getClient()

const cache = flatCache.load('esteemed-api')
const cacheKey =  '__express__/qbo'

export function getClient() {
  return new oAuthClient({
    clientId: process.env.QBO_CLIENT_ID,
    clientSecret: process.env.QBO_CLIENT_SECRET,
    environment: 'production',
    redirectUri: `${process.env.URL}/intuit/callback`
  });
}

export function getAuthUri() {
  return qboClient.authorizeUri({
    scope: [oAuthClient.scopes.Accounting, oAuthClient.scopes.OpenId],
    state: 'esteemed-api',
  })
}

export async function setToken(url) {
  qboClient
    .createToken(url)
    .then(authResponse => {
      qboClient.setToken(authResponse.getJson())
      cache.setKey(cacheKey, authResponse.getJson())
      cache.save(true)
    })
    .catch(e => {
      console.error('The error message is :' + e.originalMessage);
      console.error(e.intuit_tid);
    })
}

export async function refreshToken() {
  const accessToken = cache.getKey(cacheKey)
  qboClient.setToken(accessToken)

  qboClient
    .refresh()
    .then(authResponse => {
      console.log('Tokens refreshed : ' + JSON.stringify(authResponse.getJson()));
      qboClient.setToken(authResponse.getJson())
      cache.setKey(cacheKey, authResponse.getJson())
      cache.save(true)
    })
    .catch(function (e) {
      console.error('The error message is :' + e.originalMessage);
      console.error(e.intuit_tid);
    });
}

export async function createInvoice(hours) {
  await refreshToken()

  qboClient
    .makeApiCall({
      url: `${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/invoice`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hours),
    })
    .then(function (response) {
      console.log('The API response is  : ' + response);
      return response
    })
    .catch(function (e) {
      console.log('The error is ' + JSON.stringify(e));
    });
}

export async function batchInvoices(hours) {
  await refreshToken()

  const batchCount = 30

  for (let i = 0; i < hours.length; i += batchCount) {
    let batch = {
      BatchItemRequest: hours.slice(i, i + batchCount).map((invoice, index) => ({
        bId: `invoice${index}`,
        operation: 'create',
        Invoice: invoice
      }))
    }

    qboClient
      .makeApiCall({
        url: `${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/batch`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      })
      .then(function (response) {
        console.log('The API response is  : ' + response);
        return response
      })
      .catch(function (e) {
        console.log('The error is ' + JSON.stringify(e));
      });
  }
}

export async function createBill(hours) {
  await refreshToken()

  return qboClient
    .makeApiCall({
      url: `${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/bill`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hours),
    })
    .then(function (response) {
      console.log('The API response is  : ' + response);
      return response
    })
    .catch(function (e) {
      console.log('The error is ' + JSON.stringify(e));
    });
}

export async function getProjects() {
  await refreshToken()
  const selectStatement = "select * from Customer MAXRESULTS 1000"

  return qboClient
    .makeApiCall({
      url: `${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/query?query=${selectStatement}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(({ response }) => JSON.parse(response.body))
    .then(data => {
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
}

export async function getCompanies() {
  await refreshToken()
  const selectStatement = "select * from Customer"

  return qboClient
    .makeApiCall({
      url: `${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/query?query=${selectStatement}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(({ response }) => JSON.parse(response.body))
    .then(body => body.QueryResponse.Customer.map(customer => ({
      id: customer.Id,
      name: customer.CompanyName,
    })))
}

export async function getVendor(email) {
  await refreshToken()
  const selectStatement = "select * from Vendor"

  return qboClient
    .makeApiCall({
      url: `${baseUrl}/v3/company/${process.env.QBO_COMPANY_ID}/query?query=${selectStatement}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(({ response }) => JSON.parse(response.body))
    .then(body => {
      const vendor = body.QueryResponse.Vendor.find(vendor => vendor.PrimaryEmailAddr ? vendor.PrimaryEmailAddr.Address == email : false)
      return vendor ? vendor.Id : false
    })
}
