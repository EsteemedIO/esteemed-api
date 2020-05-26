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
    },
    skills: {
      "api": "APIs",
      "adobe_creative_suite": "Adobe Creative Suite",
      "bootstrap": "Bootstrap",
      "cli": "CLI",
      "communication": "Communication",
      "custom_themes": "Custom Themes",
      "ecommerce": "eCommerce",
      "gitflow": "Git-flow",
      "github": "GitHub",
      "jquery": "jQuery",
      "lamp": "LAMP Stack",
      "mysql": "MariaDB / MySQL",
      "mobile_design": "Mobile Design",
      "sass": "SASS",
      "seo": "SEO",
      "ui": "UI / UX",
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
