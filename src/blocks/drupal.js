const keyValue = require('../util/keyValue')

module.exports = (base_url, id) => {
  const url = base_url + 'profile/' + id.toLowerCase()
  const link = '<' + url + '|' + 'View my Drupal Profile>'

  return [
    {
      "type": "section",
      "block_id": "drupal_profile",
      "text": {
        "type": "mrkdwn",
        "text": link
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Edit Drupal Profile"
        },
        "value": "drupal_profile"
      }
    }
  ]
}
