module.exports = [
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "Which code languages do work with? Choose as many as you like."
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
  }
]

