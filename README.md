### Esteemed API

This repository provides the API layer for Esteemed's services. To begin local
development, please follow these steps.

1. Run `npm i` to install the required Node packages.
2. Create test instances for each of the following:
  - [Slack App](https://api.slack.com/apps?new_app=1) (in your own test Slack instance)
    - Setup Slack App environmental settings (https://api.slack.com/apps/xxxxxx):
      1. Features > OAuth & Permissions > Bot Token Scopes
        - channels:read
        - chat:write
        - chat:write.public
        - commands
        - groups:read
        - im:read
        - mpim:read
        - users:read
        - users:read.email
      2. Features > Interactivity & Shortcuts > Interactivity > Request URL: Add URL https://xxxxxx.eu.ngrok.io/dev/slack/events
      3. Features > Event Subscriptions > Enable Events > Request URL: Add URL https://xxxxxx.eu.ngrok.io/dev/slack/events
      4. Features > Event Subscriptions > Subscribe to bot events: app_home_opened, team_join
3. Copy .env.example to .env and populate with your own test API values.
4. Run `npm run develop` to create a local API server.
5. Use a tunneling software (such as ngrok) to expose your API outside of your network.
6. Update the values in step 2 with your ngrok values.
