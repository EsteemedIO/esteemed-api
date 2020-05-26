const values = require('./util/keyValue')

exports.handler = async event => {
  const config = {
    valueMap: values,
    titles: {
      "architect": "Architect",
      "art_director": "Art Director",
      "backend": "Backend Developer",
      "frontend": "Frontend Developer",
      "full_stack": "Full-Stack Developer",
      "pm": "Project Manager",
      "qa_tester": "QA Tester",
      "sys_admin": "System Administrator",
      "ux_designer": "UX Designer",
      "visual_designer": "Visual Designer",
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(config),
  }
}
