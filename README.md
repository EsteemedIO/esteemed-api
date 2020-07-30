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
  - [AWS](https://aws.amazon.com/)
    - Setup parameters by going to Systems Manager > Parameter Store (all should be of type SecureString)
      - /prod/allowedChannels (comma delimited list of Slack channel IDs)
      - /prod/googleMaps (Google Map API key)
      - /prod/slackSigning (Slack Signing secret)
      - /prod/slackTokenBot (Slack Bot token)
3. Copy example.secrets.yml and populate with your own test API values.
4. Run `npm run develop` to create a local API server.
5. Run `sls tunnel` to create ngrok public tunnel on localhost. (https://xxxxxx.eu.ngrok.io)
6. Run `npm run deploy` to deploy your API to AWS.
