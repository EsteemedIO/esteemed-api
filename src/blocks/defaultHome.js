module.exports = [
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "Please choose the role titles that best fit your background and experience."
    },
    "accessory": {
      "type": "multi_static_select",
      "placeholder": {
        "type": "plain_text",
        "text": "Titles",
      },
      "action_id": "titles",
      "options": [
        {
          "text": {
            "type": "plain_text",
            "text": "Architect",
          },
          "value": "architect"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Art Director",
          },
          "value": "art_director"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Backend Developer"
          },
          "value": "backend"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Frontend Developer"
          },
          "value": "frontend"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Full-Stack Developer"
          },
          "value": "full_stack"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Project Manager"
          },
          "value": "pm"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "QA Tester"
          },
          "value": "qa_tester"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "System Administrator",
          },
          "value": "sys_admin"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "UX Designer",
          },
          "value": "ux_designer"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Visual Designer",
          },
          "value": "visual_designer"
        },
      ]
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "What are some of your top skills? (Select up to 5)"
    },
    "accessory": {
      "type": "multi_static_select",
      "placeholder": {
        "type": "plain_text",
        "text": "Select skills",
      },
      "action_id": "skills",
      "max_selected_items": 5,
      "options": [
        {
          "text": {
            "type": "plain_text",
            "text": "APIs",
          },
          "value": "api"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Adobe Creative Suite",
          },
          "value": "adobe_creative_suite"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Bootstrap",
          },
          "value": "bootstrap"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "CLI",
          },
          "value": "cli"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Communication",
          },
          "value": "communication"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Custom Themes",
          },
          "value": "custom_themes"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "eCommerce",
          },
          "value": "ecommerce"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Git-flow",
          },
          "value": "gitflow"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "GitHub",
          },
          "value": "github"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "jQuery",
          },
          "value": "jquery"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "LAMP Stack",
          },
          "value": "lamp"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "MariaDB / MySQL",
          },
          "value": "mysql"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Mobile Design",
          },
          "value": "mobile_design"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "SASS",
          },
          "value": "sass"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "SEO",
          },
          "value": "seo"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "UI / UX",
          },
          "value": "ui"
        },
      ]
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "Are you expert with any popular Website Builders?"
    },
    "accessory": {
      "type": "multi_static_select",
      "placeholder": {
        "type": "plain_text",
        "text": "Select items",
      },
      "action_id": "builders",
      "options": [
        {
          "text": {
            "type": "plain_text",
            "text": "Wix",
          },
          "value": "wix"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Squarespace",
          },
          "value": "squarespace"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Shopify",
          },
          "value": "shopify"
        }
      ]
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "Which coding languages do you work with? Choose as many as you like."
    },
    "accessory": {
      "type": "multi_static_select",
      "placeholder": {
        "type": "plain_text",
        "text": "Select items",
      },
      "action_id": "languages",
      "options": [
        {
          "text": {
            "type": "plain_text",
            "text": "PHP",
          },
          "value": "php"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "HTML",
          },
          "value": "html"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "CSS",
          },
          "value": "css"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "JavaScript",
          },
          "value": "javascript"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "DotNet",
          },
          "value": "dotnet"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Java",
          },
          "value": "java"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Ruby",
          },
          "value": "ruby"
        }
      ]
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "Which CMS products do you have experience with?"
    },
    "accessory": {
      "type": "multi_static_select",
      "placeholder": {
        "type": "plain_text",
        "text": "Select items",
      },
      "action_id": "cms",
      "options": [
        {
          "text": {
            "type": "plain_text",
            "text": "Drupal",
          },
          "value": "drupal"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "WordPress",
          },
          "value": "wordpress"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Sitecore",
          },
          "value": "sitecore"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Adobe Experience Manager (AEM)",
          },
          "value": "aem"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Laravel",
          },
          "value": "laravel"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Ruby on Rails (RoR)",
          },
          "value": "ror"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Episerver",
          },
          "value": "episerver"
        }
      ]
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "Enter the date you are available for at least part time hours"
    },
    "accessory": {
      "type": "datepicker",
      "action_id": "date_available",
      "placeholder": {
        "type": "plain_text",
        "text": "Select a date"
      }
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "How many hours per week are you available?"
    },
    "accessory": {
      "type": "static_select",
      "placeholder": {
        "type": "plain_text",
        "text": "Availability",
      },
      "action_id": "availability",
      "options": [
        {
          "text": {
            "type": "plain_text",
            "text": "10 hours per week"
          },
          "value": "10hours"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "20 hours per week"
          },
          "value": "20hours"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "30 hours per week"
          },
          "value": "30hours"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "40 hours"
          },
          "value": "40hours"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "As needed, Open to offers"
          },
          "value": "open"
        },
      ]
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "Are you authorized to work full-time in the country you are applying?"
    },
    "accessory": {
      "type": "static_select",
      "placeholder": {
        "type": "plain_text",
        "text": "Citizenship Status",
      },
      "action_id": "citizen",
      "options": [
        {
          "text": {
            "type": "plain_text",
            "text": "I am a citizen",
          },
          "value": "citizen"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "I am in need of sponsorship",
          },
          "value": "not_citizen"
        },
      ]
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "English Proficiency",
    },
    "accessory": {
      "type": "static_select",
      "placeholder": {
        "type": "plain_text",
        "text": "Choose your level",
      },
      "action_id": "english",
      "options": [
        {
          "text": {
            "type": "plain_text",
            "text": "Elementary"
          },
          "value": "elementary"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Intermediate"
          },
          "value": "intermediate"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Native"
          },
          "value": "native"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "Proficient"
          },
          "value": "proficient"
        },
      ]
    }
  },
]
