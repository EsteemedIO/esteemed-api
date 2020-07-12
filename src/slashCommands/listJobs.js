const keyValue = require('../util/keyValue')
const jobsList = require('../util/jobsList')
const { getUser } = require('../util/userProfiles')

module.exports = async (req, res) => {
  try {
    const currentUser = await getUser(req.body.user_id)

    const blocks = await jobsList()
      .then(jobs => jobs.map(job => {
        let text = [
          {
            key: keyValue.categories,
            value: job.categories.map(x => keyValue[x]).reduce((acc, i) => `${acc}\n- ${i}`, '')
          },
          {
            key: keyValue.attendance,
            value: keyValue[job.attendance]
          },
          {
            key: keyValue.experience,
            value: keyValue[job.experience]
          },
          {
            key: keyValue.engagement,
            value: keyValue[job.engagement]
          },
          {
            key: keyValue.duration,
            value: keyValue[job.duration]
          },
          {
            key: keyValue.weekly_hours,
            value: keyValue[job.weekly_hours]
          },
          {
            key: keyValue.location_req,
            value: keyValue[job.location_req]
          },
          {
            key: keyValue.description,
            value: job.description.replace(/<[^>]*>?/gm, '').substr(0, 280) + '...'
          },
        ]

        if (currentUser.is_admin) {
          text.push({
            key: keyValue.rate_client,
            value: `$${job.rate_client}`
          })
        }

        const block = {
          type: "section",
          text: {
            type: "mrkdwn",
            text: text.reduce((acc, i) => acc + `*${i.key}*: ${i.value}\n`, '')
          },
        }

        let button = {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: `Apply for ${job.title}`,
              },
              value: job.key,
              action_id: "apply_btn",
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Recommend Applicant",
              },
              value: job.key,
              action_id: "recommend_btn",
            },
          ],
        }

        if (currentUser.is_admin) {
          button.elements.push({
            type: "button",
            text: {
              type: "plain_text",
              text: "Add Notes",
            },
            value: job.key,
            action_id: "add-notes_btn",
          })
        }

        return [ block, button ]
      })
      .flatMap((v, i, a) => a.length - 1 !== i ? [v, { "type": "divider" }] : v)
      .flat()
    )

    res.send({ blocks: blocks })
  } catch (err) {
    if (err) return err
  }
}
