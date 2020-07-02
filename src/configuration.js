const values = require('./util/keyValue')

module.exports = res => {
  res.send({
    valueMap: values,
    titles: [
      {
        key: "architect",
        value: "Architect"
      },
      {
        key: "art_director",
        value: "Art Director"
      },
      {
        key: "backend",
        value: "Backend Developer"
      },
      {
        key: "frontend",
        value: "Frontend Developer"
      },
      {
        key: "full_stack",
        value: "Full-Stack Developer"
      },
      {
        key: "pm",
        value: "Project Manager"
      },
      {
        key: "qa_tester",
        value: "QA Tester"
      },
      {
        key: "sys_admin",
        value: "System Administrator"
      },
      {
        key: "ux_designer",
        value: "UX Designer"
      },
      {
        key: "visual_designer",
        value: "Visual Designer"
      },
    ],
    skills: [
      {
        key: "api",
        value: "APIs"
      },
      {
        key: "adobe_creative_suite",
        value: "Adobe Creative Suite"
      },
      {
        key: "bootstrap",
        value: "Bootstrap"
      },
      {
        key: "cli",
        value: "CLI"
      },
      {
        key: "communication",
        value: "Communication"
      },
      {
        key: "custom_themes",
        value: "Custom Themes"
      },
      {
        key: "ecommerce",
        value: "eCommerce"
      },
      {
        key: "gitflow",
        value: "Git-flow"
      },
      {
        key: "github",
        value: "GitHub"
      },
      {
        key: "jquery",
        value: "jQuery"
      },
      {
        key: "lamp",
        value: "LAMP Stack"
      },
      {
        key: "mysql",
        value: "MariaDB / MySQL"
      },
      {
        key: "mobile_design",
        value: "Mobile Design"
      },
      {
        key: "sass",
        value: "SASS"
      },
      {
        key: "seo",
        value: "SEO"
      },
      {
        key: "ui",
        value: "UI / UX"
      }
    ]
  })
}
