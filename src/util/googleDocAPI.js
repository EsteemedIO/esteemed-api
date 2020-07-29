const { google } = require("googleapis");
const keyValue = require('../util/keyValue');

const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
const token = JSON.parse(process.env.GOOGLE_DRIVE_TOKEN);
const templateId = process.env.TEMPLATE_RESUME_DOC_ID;

const authorize = () => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

module.exports.createResume = async (profile, externalProfile) => {
    let requests = [];
    const maxSkillRows = 50;
    const maxOtherSkillRows = 50;
    const maxExperienceRows = 20;
    const maxProjectRows = 30;
    const maxEducationRows = 15;
    const maxCertificateRows = 20;
    const maxLanguageRows = 10;
    
    const auth = await authorize();
    const drive = google.drive({
      version: "v2",
      auth
    });
    const docs = google.docs({
      version: "v1",
      auth
    });

    // Copy template
    const resCopy = await drive.files.copy({
      fileId: templateId,
      resource: {
        title: "Esteemed_" + profile.real_name
      }
    }).then((resp) => {
      return resp;
    }).catch((error) => {
      return error;
    });

    if(resCopy.errors) {
      return {
          success: false,
          message: "Error for copying template resume.",
          bareMSG: JSON.stringify(resCopy.errors)
      };
    }

    // NamedRanges contains "table startIndex and endIndex" which are used for removing unnecessary table rows. 
    // They are part of JSON of "resume template" fetched by https://developers.google.com/docs/api/reference/rest/v1/documents/get
    const namedRanges = {
      "skills": {
        "name": "skills",
        "namedRanges": [
          {
            "namedRangeId": "kix.ug96myrrd5bq",
            "name": "skills",
            "ranges": [
              {
                "startIndex": 75,
                "endIndex": 2019
              }
            ]
          }
        ]
      },
      "education": {
        "name": "education",
        "namedRanges": [
          {
            "namedRangeId": "kix.hclq926lve2q",
            "name": "education",
            "ranges": [
              {
                "startIndex": 10612,
                "endIndex": 12108
              }
            ]
          }
        ]
      },
      "projects": {
        "name": "projects",
        "namedRanges": [
          {
            "namedRangeId": "kix.m2r8di65inna",
            "name": "projects",
            "ranges": [
              {
                "startIndex": 7282,
                "endIndex": 10599
              }
            ]
          }
        ]
      },
      "languages": {
        "name": "languages",
        "namedRanges": [
          {
            "namedRangeId": "kix.sae6zlpdc6vw",
            "name": "languages",
            "ranges": [
              {
                "startIndex": 13181,
                "endIndex": 13404
              }
            ]
          }
        ]
      },
      "certificates": {
        "name": "certificates",
        "namedRanges": [
          {
            "namedRangeId": "kix.aeo5zxpausix",
            "name": "certificates",
            "ranges": [
              {
                "startIndex": 12124,
                "endIndex": 13168
              }
            ]
          }
        ]
      },
      "other_skills": {
        "name": "other_skills",
        "namedRanges": [
          {
            "namedRangeId": "kix.d0p5ljf4hkul",
            "name": "other_skills",
            "ranges": [
              {
                "startIndex": 2035,
                "endIndex": 4579
              }
            ]
          }
        ]
      },
      "experience": {
        "name": "experience",
        "namedRanges": [
          {
            "namedRangeId": "kix.rs6im8yvdmj8",
            "name": "experience",
            "ranges": [
              {
                "startIndex": 4593,
                "endIndex": 7270
              }
            ]
          }
        ]
      }
    }

    // Update the copied template
    // !Order of requests construction is important.
    requests = addReplaceAllText(requests, "{{NAME}}", profile.real_name ? profile.real_name : "NO NAME");
    requests = addReplaceAllText(requests, "{{TITLE}}", profile.title ? profile.title : "NO TITLE");
    requests = addReplaceImage(requests, "i.0", profile.image_512);

    if(externalProfile){
      requests = addReplaceAllText(requests, "{{LOCATION}}", externalProfile.locality ? externalProfile.locality : "");
      requests = addReplaceAllText(requests, "{{SUMMARY_CONTENT}}", externalProfile.summary ? externalProfile.summary : "");
  
      if(externalProfile.skills)
        externalProfile.skills.forEach((skill, index) => {
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_skill_item + (index+1) + "}}", skill);
          if(externalProfile.skills.length === index+1)
            requests = addReplaceAllText(requests, "{{" + keyValue.doc_skill_item + (index+2) + "}}", "");
        });

      if(externalProfile.other_skills)
        externalProfile.other_skills.forEach((other_skills, index) => {
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_other_skill_item + (index+1) + "}}", other_skills);
          if(externalProfile.other_skills.length === index+1)
            requests = addReplaceAllText(requests, "{{" + keyValue.doc_other_skill_item + (index+2) + "}}", "");
        });

      if(externalProfile.languages)
        externalProfile.languages.forEach((lang, index) => {
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_lang_item + (index+1) + "}}", lang);
        });

      if(externalProfile.experience)
        externalProfile.experience.forEach((exp, index) => {
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_exp_position + (index+1) + "}}", exp.position);
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_exp_from + (index+1) + "}}", exp.from);
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_exp_to + (index+1) + "}}", exp.to);
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_exp_company + (index+1) + "}}", exp.company);
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_exp_description + (index+1) + "}}", exp.description);
        });

      if(externalProfile.projects)
        externalProfile.projects.forEach((proj, index) => {
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_proj_title + (index+1) + "}}", proj.title);
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_proj_url + (index+1) + "}}", proj.url);
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_proj_from + (index+1) + "}}", proj.from);
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_proj_to + (index+1) + "}}", proj.to);
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_proj_description + (index+1) + "}}", proj.description);
        });

      if(externalProfile.education)
        externalProfile.education.forEach((edu, index) => {
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_edu_place_name + (index+1) + "}}", edu.university);
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_edu_from + (index+1) + "}}", edu.from);
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_edu_to + (index+1) + "}}", edu.to);
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_edu_degree + (index+1) + "}}", edu.degree);
        });

      if(externalProfile.certificates)
        externalProfile.certificates.forEach((cert, index) => {
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_cert_title + (index+1) + "}}", cert.title);
          requests = addReplaceAllText(requests, "{{" + keyValue.doc_cert_date + (index+1) + "}}", cert.date);
        });
  
      if(externalProfile.skills)
        for(let i = 0; i < maxSkillRows - Math.ceil(externalProfile.skills.length / 2); i ++){
          requests = addDeleteTableRow(requests, namedRanges.skills.namedRanges[0].ranges[0].startIndex, Math.ceil(externalProfile.skills.length / 2));
        }
      else
        for(let i = 0; i < maxSkillRows; i ++){
          requests = addDeleteTableRow(requests, namedRanges.skills.namedRanges[0].ranges[0].startIndex, 0);
        }

      if(externalProfile.other_skills)
        for(let i = 0; i < maxOtherSkillRows - Math.ceil(externalProfile.other_skills.length / 2); i ++){
          requests = addDeleteTableRow(requests, namedRanges.other_skills.namedRanges[0].ranges[0].startIndex, Math.ceil(externalProfile.other_skills.length / 2));
        }
      else
        for(let i = 0; i < maxOtherSkillRows; i ++){
          requests = addDeleteTableRow(requests, namedRanges.other_skills.namedRanges[0].ranges[0].startIndex, 0);
        }

      if(externalProfile.experience)
        for(let i = 0; i < maxExperienceRows - externalProfile.experience.length; i ++){
          requests = addDeleteTableRow(requests, namedRanges.experience.namedRanges[0].ranges[0].startIndex, externalProfile.experience.length);
        }
      else
        for(let i = 0; i < maxExperienceRows; i ++){
          requests = addDeleteTableRow(requests, namedRanges.experience.namedRanges[0].ranges[0].startIndex, 0);
        }

      if(externalProfile.projects)
        for(let i = 0; i < maxProjectRows - externalProfile.projects.length; i ++){
          requests = addDeleteTableRow(requests, namedRanges.projects.namedRanges[0].ranges[0].startIndex, externalProfile.projects.length);
        }
      else
        for(let i = 0; i < maxProjectRows; i ++){
          requests = addDeleteTableRow(requests, namedRanges.projects.namedRanges[0].ranges[0].startIndex, 0);
        }

      if(externalProfile.education)
        for(let i = 0; i < maxEducationRows - externalProfile.education.length; i ++){
          requests = addDeleteTableRow(requests, namedRanges.education.namedRanges[0].ranges[0].startIndex, externalProfile.education.length);
        }
      else 
        for(let i = 0; i < maxEducationRows ; i ++){
          requests = addDeleteTableRow(requests, namedRanges.education.namedRanges[0].ranges[0].startIndex, 0);
        }

      if(externalProfile.certificates)
        for(let i = 0; i < maxCertificateRows - externalProfile.certificates.length; i ++){
          requests = addDeleteTableRow(requests, namedRanges.certificates.namedRanges[0].ranges[0].startIndex, externalProfile.certificates.length);
        }
      else 
        for(let i = 0; i < maxCertificateRows; i ++){
          requests = addDeleteTableRow(requests, namedRanges.certificates.namedRanges[0].ranges[0].startIndex, 0);
        }

      if(externalProfile.languages)
        for(let i = 0; i < maxLanguageRows - externalProfile.languages.length; i ++){
          requests = addDeleteTableRow(requests, namedRanges.languages.namedRanges[0].ranges[0].startIndex, externalProfile.languages.length);
        }
      else 
        for(let i = 0; i < maxLanguageRows; i ++){
          requests = addDeleteTableRow(requests, namedRanges.languages.namedRanges[0].ranges[0].startIndex, 0);
        }

    }

    const resUpdate = await docs.documents.batchUpdate({
      auth,
      documentId: resCopy.data.id,
      requestBody: {
        requests: requests
      }
    }).then((resp) => {
      return resp;
    }).catch((error) => {
      return error;
    });

    if(resUpdate.errors) {
      return {
          success: false,
          message: "Error for creating resume.",
          bareMSG: JSON.stringify(resUpdate.errors)
      };
    }else{
      return {
        success: true,
        resumeURL: resCopy.data.embedLink
      };
    }
}

const addReplaceAllText = (requests, oldVal, newVal) => {
  return [
    {
      replaceAllText: {
        containsText: {
          matchCase: true,
          text: oldVal
        },
        replaceText: newVal
      }
    },
    ...requests
  ]
}

const addReplaceImage = (requests, imageObjectId, imageURI) => {
  return [
    {
      replaceImage: {
        imageObjectId: imageObjectId,
        uri: imageURI
      }
    },
    ...requests
  ]
}

const addDeleteTableRow = (requests, startIndex, rowIndex) => {
  return [
    {
      deleteTableRow: {
        tableCellLocation: {
          tableStartLocation: {
            index: startIndex
          },
          rowIndex: rowIndex
        }
      }
    },
    ...requests
  ]
}