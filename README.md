### Esteemed API

This repository provides the API layer for Esteemed's services. To begin local
development, please follow the following steps.

1. Run `npm i` to install the required Node packages.
2. Create test instances for each of the following:
  - [AWS](https://aws.amazon.com/)
  - [Slack App](https://api.slack.com/apps?new_app=1) (in your own test Slack
    instance)
  - [Firebase](https://firebase.google.com/)
3. Copy example.secrets.yml and populate with your own test API values.
4. Run `npm run develop` to create a local API server.
5. Run `npm run deploy` to deploy your API to AWS.
