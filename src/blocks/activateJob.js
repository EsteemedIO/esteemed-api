module.exports = {
  type: "input",
  block_id: "job_active",
  element: {
    action_id: "val",
    type: "radio_buttons",
    confirm: {
      title: {
        type: "plain_text",
        text: "Are you sure?",
      },
      text: {
        type: "mrkdwn",
        text: "Not Yet",
      },
      confirm: {
        type: "plain_text",
        text: "Do it",
      },
      deny: {
        type: "plain_text",
        text: "Stop, I've changed my mind!",
      },
    },
    options: [
      {
        text: {
          type: "plain_text",
          text: "Yes",
        },
        value: "true",
      },
      {
        text: {
          type: "plain_text",
          text: "No",
        },
        value: "false",
      },
    ],
  },
  label: {
    type: "plain_text",
    text: "Set to Active",
  },
}
