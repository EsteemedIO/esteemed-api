const keyValue = require('../util/keyValue')

module.exports = (base_url, id) => {
  const url = base_url + 'profile/' + id.toLowerCase()
  const link = '<' + url + '|' + 'View my Wordpress Profile>'

  return [
    {
      "type": "section",
      "block_id": "wp_profile",
      "text": {
        "type": "mrkdwn",
        "text": link
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Edit WP Profile",
        },
        "value": "wp_profile"
      }
    }
  ]
}
