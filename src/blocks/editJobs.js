const keyValue = require("../util/keyValue");

module.exports = [
  {
    type: "input",
    block_id: "attendance",
    element: {
      action_id: "val",
      type: "static_select",
      placeholder: {
        type: "plain_text",
        text: "Options",
      },
      initial_option: {
        text: {
          type: "plain_text",
          text: "",
          emoji: true,
        },
        value: "",
      },
      options: [
        {
          text: {
            type: "plain_text",
            text: "remote",
          },
          value: "remote",
        },
        {
          text: {
            type: "plain_text",
            text: "on-site",
          },
          value: "on-site",
        },
        {
          text: {
            type: "plain_text",
            text: "mixed",
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
      type: "static_select",
      action_id: "val",
      placeholder: {
        type: "plain_text",
        text: "Options",
      },
      initial_option: {
        text: {
          type: "plain_text",
          text: "",
          emoji: true,
        },
        value: "",
      },
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
            text: keyValue.backend_developer,
          },
          value: "backend_developer",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.frontend_developer,
          },
          value: "frontend_developer",
        },
        {
          text: {
            type: "plain_text",
            text: keyValue.full_stack_developer,
          },
          value: "full_stack_developer",
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
      action_id: "val",
      multiline: true,
      initial_value: "",
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
      action_id: "val",
      placeholder: {
        type: "plain_text",
        text: "Options",
      },
      initial_option: {
        text: {
          type: "plain_text",
          text: "",
          emoji: true,
        },
        value: "",
      },
      options: [
        {
          text: {
            type: "plain_text",
            text: "3 Month",
          },
          value: "3_month",
        },
        {
          text: {
            type: "plain_text",
            text: "6 Month",
          },
          value: "6_month",
        },
        {
          text: {
            type: "plain_text",
            text: "6 Month Ext",
          },
          value: "6_month_ext",
        },
        {
          text: {
            type: "plain_text",
            text: "1yr",
          },
          value: "1yr",
        },
        {
          text: {
            type: "plain_text",
            text: "2yr",
          },
          value: "2yr",
        },
        {
          text: {
            type: "plain_text",
            text: "3yr",
          },
          value: "3yr",
        },
        {
          text: {
            type: "plain_text",
            text: "4yr",
          },
          value: "4yr",
        },
        {
          text: {
            type: "plain_text",
            text: "5yr",
          },
          value: "5yr",
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
      action_id: "val",
      placeholder: {
        type: "plain_text",
        text: "Options",
      },
      initial_option: {
        text: {
          type: "plain_text",
          text: "",
          emoji: true,
        },
        value: "",
      },
      options: [
        {
          text: {
            type: "plain_text",
            text: "Contract",
          },
          value: "contract",
        },
        {
          text: {
            type: "plain_text",
            text: "Contract To Perm",
          },
          value: "contract_to_perm",
        },
        {
          text: {
            type: "plain_text",
            text: "Perm",
          },
          value: "perm",
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
    block_id: "experiance",
    element: {
      type: "static_select",
      action_id: "val",
      placeholder: {
        type: "plain_text",
        text: "Options",
      },
      initial_option: {
        text: {
          type: "plain_text",
          text: "",
          emoji: true,
        },
        value: "",
      },
      options: [
        {
          text: {
            type: "plain_text",
            text: "Entry",
          },
          value: "entry",
        },
        {
          text: {
            type: "plain_text",
            text: "Intermediate",
          },
          value: "intermediate",
        },
        {
          text: {
            type: "plain_text",
            text: "Expert",
          },
          value: "expert",
        },
      ],
    },
    label: {
      type: "plain_text",
      text: "Experiance",
    },
  },
  {
    type: "input",
    block_id: "location_req",
    element: {
      type: "static_select",
      action_id: "val",
      placeholder: {
        type: "plain_text",
        text: "Options",
      },
      initial_option: {
        text: {
          type: "plain_text",
          text: "",
          emoji: true,
        },
        value: "",
      },
      options: [
        {
          text: {
            type: "plain_text",
            text: "Us",
          },
          value: "us",
        },
        {
          text: {
            type: "plain_text",
            text: "Us Can",
          },
          value: "us_can",
        },
        {
          text: {
            type: "plain_text",
            text: "Anywhere",
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
      action_id: "val",
      initial_value: "",
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
      action_id: "val",
      initial_value: "",
    },
    label: {
      type: "plain_text",
      text: "Rate Esteemd",
    },
  },
  //*-----------------
  {
    type: "input",
    block_id: "skills",

    element: {
      type: "static_select",
      action_id: "val",
      placeholder: {
        type: "plain_text",
        text: "Select skills",
      },
      initial_option: {
        text: {
          type: "plain_text",
          text: "",
          emoji: true,
        },
        value: "",
      },
      // max_selected_items: 5,
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
  //*-----------------
  {
    type: "input",
    block_id: "start_date",
    element: {
      type: "datepicker",
      action_id: "val",
      initial_date: "2020-01-01",
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
      action_id: "val",
      initial_value: "",
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
      action_id: "val",
      initial_value: "",
    },
    label: {
      type: "plain_text",
      text: "Title",
    },
  },
];
