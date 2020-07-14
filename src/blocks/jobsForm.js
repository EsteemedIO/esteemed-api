const keyValue = require("../util/keyValue");

date = new Date()

module.exports = [
  {
    type: "input",
    block_id: "attendance",
    element: {
      action_id: "attendance",
      type: "static_select",
      placeholder: {
        type: "plain_text",
        text: "Options",
      },
      options: [
        {
          text: {
            type: "plain_text",
            text: keyValue.remote,
          },
          value: "remote",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.on_site,
          },
          value: "on_site",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.mixed,
          },
          value: "mixed",
        },
      ],
    },
    label: {
      type: "plain_text",
      text: "Attendance",
    },
  },
  {
    type: "input",
    block_id: "categories",
    element: {
      type: "multi_static_select",
      action_id: "categories",
      placeholder: {
        type: "plain_text",
        text: "Options",
      },
      max_selected_items: 3,
      options: [
        {
          text: {
            type: "plain_text",
            text: keyValue.architect,
          },
          value: "architect",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.art_director,
          },
          value: "art_director",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.backend,
          },
          value: "backend",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.frontend,
          },
          value: "frontend",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.full_stack,
          },
          value: "full_stack",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.pm,
          },
          value: "pm",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.qa_tester,
          },
          value: "qa_tester",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.sys_admin,
          },
          value: "sys_admin",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.ux_designer,
          },
          value: "ux_designer",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.visual_designer,
          },
          value: "visual_designer",
        },
      ],
    },
    label: {
      type: "plain_text",
      text: "Categories",
    },
  },
  {
    type: "input",
    block_id: "description",
    element: {
      type: "plain_text_input",
      action_id: "description",
      multiline: true,
      placeholder: {
        type: "plain_text",
        text: "Job Description",
      },
    },
    label: {
      type: "plain_text",
      text: "Description",
    },
  },
  {
    type: "input",
    block_id: "duration",
    element: {
      type: "static_select",
      action_id: "duration",
      placeholder: {
        type: "plain_text",
        text: "Options",
      },
      options: [
        {
          text: {
            type: "plain_text",
            text: keyValue.months_3,
          },
          value: "months_3",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.months_6,
          },
          value: "months_6",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.months_6_ext,
          },
          value: "months_6_ext",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.year_1,
          },
          value: "1 year",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.year_2,
          },
          value: "2 years",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.year_3,
          },
          value: "3 years",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.year_4,
          },
          value: "4 years",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.year_5,
          },
          value: "5 years",
        },
      ],
    },
    label: {
      type: "plain_text",
      text: "Duration",
    },
  },
  {
    type: "input",
    block_id: "engagement",
    element: {
      type: "static_select",
      action_id: "engagement",
      placeholder: {
        type: "plain_text",
        text: "Options",
      },
      options: [
        {
          text: {
            type: "plain_text",
            text: keyValue.contract,
          },
          value: "contract",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.contract_to_perm,
          },
          value: "contract_to_perm",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.permanent,
          },
          value: "permanent",
        },
      ],
    },
    label: {
      type: "plain_text",
      text: "Engagement",
    },
  },
  {
    type: "input",
    block_id: "experience",
    element: {
      type: "static_select",
      action_id: "experience",
      placeholder: {
        type: "plain_text",
        text: "Options",
      },
      options: [
        {
          text: {
            type: "plain_text",
            text: keyValue.entry,
          },
          value: "entry",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.intermediate,
          },
          value: "intermediate",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.expert,
          },
          value: "expert",
        },
      ],
    },
    label: {
      type: "plain_text",
      text: "Experience",
    },
  },
  {
    type: "input",
    block_id: "location_req",
    element: {
      type: "static_select",
      action_id: "location_req",
      placeholder: {
        type: "plain_text",
        text: "Options",
      },
      options: [
        {
          text: {
            type: "plain_text",
            text: keyValue.us,
          },
          value: "us",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.us_can_greencard,
          },
          value: "us_can_greencard",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.anywhere,
          },
          value: "anywhere",
        },
      ],
    },
    label: {
      type: "plain_text",
      text: "Location Required",
    },
  },
  {
    type: "input",
    block_id: "rate_client",
    element: {
      type: "plain_text_input",
      action_id: "rate_client",
      placeholder: {
        type: "plain_text",
        text: "$0",
      },
    },
    label: {
      type: "plain_text",
      text: "Rate Client",
    },
  },
  {
    type: "input",
    block_id: "rate_esteemd",
    element: {
      type: "plain_text_input",
      action_id: "rate_esteemed",
      placeholder: {
        type: "plain_text",
        text: "$0",
      },
    },
    label: {
      type: "plain_text",
      text: "Rate Esteemd",
    },
  },
  {
    type: "input",
    block_id: "skills",
    element: {
      type: "multi_static_select",
      action_id: "skills",
      placeholder: {
        type: "plain_text",
        text: "Select skills",
      },
      max_selected_items: 5,
      options: [
        {
          text: {
            type: "plain_text",
            text: keyValue.api,
          },
          value: "api",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.adobe_creative_suite,
          },
          value: "adobe_creative_suite",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.bootstrap,
          },
          value: "bootstrap",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.cli,
          },
          value: "cli",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.communication,
          },
          value: "communication",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.custom_themes,
          },
          value: "custom_themes",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.ecommerce,
          },
          value: "ecommerce",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.gitflow,
          },
          value: "gitflow",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.github,
          },
          value: "github",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.jquery,
          },
          value: "jquery",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.lamp,
          },
          value: "lamp",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.mysql,
          },
          value: "mysql",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.mobile_design,
          },
          value: "mobile_design",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.sass,
          },
          value: "sass",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.seo,
          },
          value: "seo",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.ui,
          },
          value: "ui",
        },
      ],
    },
    label: {
      type: "plain_text",
      text: "Skills Required",
    },
  },
  {
    type: "input",
    block_id: "start_date",
    element: {
      type: "datepicker",
      action_id: "start_date",
      initial_date: date.toISOString().split('T')[0],
      placeholder: {
        type: "plain_text",
        text: "Select a Start Date",
      },
    },
    label: {
      type: "plain_text",
      text: "Start Date",
    },
  },
  {
    type: "input",
    block_id: "timezone",
    element: {
      type: "plain_text_input",
      action_id: "timezone",
      placeholder: {
        type: "plain_text",
        text: "ET",
      },
    },
    label: {
      type: "plain_text",
      text: "Timezone",
    },
  },
  {
    type: "input",
    block_id: "job_title",
    element: {
      type: "plain_text_input",
      action_id: "job_title",
      placeholder: {
        type: "plain_text",
        text: "Title",
      },
    },
    label: {
      type: "plain_text",
      text: "Title",
    },
  },

  {
    type: "input",
    block_id: "availability",
    label: {
      type: "plain_text",
      text: "How many hours per week are you available?",
    },
    element: {
      action_id: "availability",
      type: "static_select",
      options: [
        {
          text: {
            type: "plain_text",
            text: keyValue.hours_10,
          },
          value: "hours_10",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.hours_20,
          },
          value: "hours_20",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.hours_30,
          },
          value: "hours_30",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.hours_40,
          },
          value: "hours_40",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.open,
          },
          value: "open",
        },
      ],
    },
  },
];
