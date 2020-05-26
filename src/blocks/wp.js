const keyValue = require('../util/keyValue')

module.exports = (base_url, id) => {
  const url = base_url + 'profile/' + id.toLowerCase()
  const link = '<' + url + '|' + 'View my Wordpress Profile>'

  return [
    {
      "type": "actions",
      "block_id": "wp_profile",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "WP Profile",
            "text": keyValue.wp_profile,
          },
          "value": "wp_profile"
        }
      ],
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": link
      }
    }
  ]
}
