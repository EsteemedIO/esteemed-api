import { google } from 'googleapis'

async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'google-api-credentials.json',
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents'
    ],
  });

  google.options({ auth: auth })
}

export async function docs() {
  await authenticate();
  return google.docs({ version: "v1" });
}

export async function drive() {
  await authenticate()
  return google.drive({ version: "v2" })
}
