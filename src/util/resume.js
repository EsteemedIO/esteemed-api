import { profiles } from '../models/profiles.js'
import { drive, docs } from './google.js'

export async function getDetails(slackId) {
  return {
    profile: await profiles.getDisplay(slackId),
    education: await profiles.getEducation(slackId),
    experience: await profiles.getWorkHistory(slackId)
  }
}

export async function format(details) {
  const filename = 'Esteemed | ' + details.profile.firstName + ' ' + details.profile.lastName[0]
  const resumeId = await getResumeTemplate(filename)
  const updates = getReplacements(details)

  return updateResume(resumeId, updates)
}

async function getResumeTemplate(filename) {
  const templateId = process.env.GOOGLE_RESUME_TEMPLATE
  const folderId = process.env.GOOGLE_RESUME_FOLDER

  let file = {
    fileId: templateId,
    supportsAllDrives: true,
    resource: {
      title: filename
    },
    parents: [{
      kind: 'drive#parentReference',
      id: '1zl-nEU7ssVwh4FDoJBQTq3ojirASZhnP',
      selfLink: `https://www.googleapis.com/drive/v2/files/${templateId}/parents/${folderId}`,
      parentLink: `https://www.googleapis.com/drive/v2/files/${folderId}`,
      isRoot: false
    }]
  }

  return drive()
    .then(drive =>
      drive.files.copy(file)
        .then(resume => resume.data.id)
        .catch(error => console.log(error))
    )
}

function getReplacements({ profile, education, experience }) {
  const updates = {
    '{{NAME}}': profile.firstName + ' ' + profile.lastName[0] + '.',
    '{{TITLE}}': profile.titles.join(', '),
    '{{LOCATION}}': profile.location.city + ', ' + profile.location.state,
    '{{SKILLS}}': profile.skills.join(', '),
    '{{EXPERIENCE}}': experience.map(job => job.title + "\n"
        + job.companyName + "\n"
        + new Date(job.startDate).toISOString().split('T')[0] + " - " + new Date(job.endDate).toISOString().split('T')[0]
      ).join("\n\n"),
    '{{EDUCATION}}': education.map(edu => edu.school + "\n"
        + edu.city + ', ' + edu.state + "\n"
        + edu.degree + ' in ' + edu.major + "\n"
        + new Date(edu.startDate).toISOString().split('T')[0] + " - " + new Date(edu.endDate).toISOString().split('T')[0]
      ).join("\n\n"),
    '{{LANGUAGES}}': profile.languages.join(', '),
    '{{CMS}}': profile.cms.join(', '),
    '{{NAME}}': profile.firstName + ' ' + profile.lastName[0] + '.',
  }

  const image = 'https://esteemed-api-97dnt.ondigitalocean.app/resume-image?image=' + profile.image

  const imageUpdate = {
    replaceImage: {
      imageObjectId: 'i.0',
      uri: image,
      imageReplaceMethod: 'CENTER_CROP'
    }
  }

  const textUpdates = Object.keys(updates).map(key => ({
    replaceAllText: {
      containsText: {
        matchCase: true,
        text: key
      },
      replaceText: updates[key]
    }
  }))

  const returnval = [imageUpdate, ...textUpdates]
  console.dir(returnval, { depth: null })

  return returnval
}

async function updateResume(resumeId, updates) {
  return docs()
    .then(docs =>
      docs.documents.batchUpdate({
        documentId: resumeId,
        requestBody: {
          requests: updates
        }
      })
      .then(({ data })=> `https://docs.google.com/document/d/${data.documentId}`)
      .catch(error => console.log(error))
    )
}
