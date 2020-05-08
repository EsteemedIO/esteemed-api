module.exports = (base_url, id) => {
  const url = base_url + id
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
