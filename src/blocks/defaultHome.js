const keyValue = require('../util/keyValue')

module.exports = [
  {
    "type": "section",
    "block_id": "location",
    "text": {
      "type": "mrkdwn",
      "text": "Choose your location by selecting the button to the right"
    },
    "accessory": {
      "type": "button",
      "text": {
        "type": "plain_text",
        "text": "Lookup Address"
      },
      "value": "location"
    }
  },
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
            "text": keyValue.architect,
          },
          "value": "architect"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.art_director,
          },
          "value": "art_director"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.backend,
          },
          "value": "backend"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.frontend,
          },
          "value": "frontend"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.full_stack,
          },
          "value": "full_stack"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.pm,
          },
          "value": "pm"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.qa,
          },
          "value": "qa_tester"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.sys_admin,
          },
          "value": "sys_admin"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.ux_designer,
          },
          "value": "ux_designer"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.visual_designer,
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
            "text": keyValue.api,
          },
          "value": "api"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.adobe_creative_suite,
          },
          "value": "adobe_creative_suite"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.bootstrap,
          },
          "value": "bootstrap"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.cli,
          },
          "value": "cli"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.communication,
          },
          "value": "communication"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.custom_themes,
          },
          "value": "custom_themes"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.ecommerce,
          },
          "value": "ecommerce"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.gitflow,
          },
          "value": "gitflow"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.github,
          },
          "value": "github"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.jquery,
          },
          "value": "jquery"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.lamp,
          },
          "value": "lamp"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.mysql,
          },
          "value": "mysql"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.mobile_design,
          },
          "value": "mobile_design"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.sass,
          },
          "value": "sass"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.seo,
          },
          "value": "seo"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.ui,
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
            "text": keyValue.wix,
          },
          "value": "wix"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.squarespace,
          },
          "value": "squarespace"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.shopify,
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
            "text": keyValue.php,
          },
          "value": "php"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.html,
          },
          "value": "html"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.css,
          },
          "value": "css"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.javascript,
          },
          "value": "javascript"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.dotnet,
          },
          "value": "dotnet"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.java,
          },
          "value": "java"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.ruby,
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
            "text": keyValue.drupal,
          },
          "value": "drupal"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.wordpress,
          },
          "value": "wordpress"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.sitecore,
          },
          "value": "sitecore"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.aem,
          },
          "value": "aem"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.laravel,
          },
          "value": "laravel"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.ror,
          },
          "value": "ror"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.episerver,
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
            "text": keyValue.hours_10,
          },
          "value": "hours_10"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.hours_20,
          },
          "value": "hours_20"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.hours_30,
          },
          "value": "hours_30"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.hours_40,
          },
          "value": "hours_40"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.open,
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
            "text": keyValue.citizen,
          },
          "value": "citizen"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.not_citizen,
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
            "text": keyValue.elementary,
          },
          "value": "elementary"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.intermediate,
          },
          "value": "intermediate"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.native,
          },
          "value": "native"
        },
        {
          "text": {
            "type": "plain_text",
            "text": keyValue.proficient,
          },
          "value": "proficient"
        },
      ]
    }
  },
]
