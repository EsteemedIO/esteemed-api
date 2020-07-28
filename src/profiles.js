const userProfiles = require('./util/userProfiles')

module.exports = async (req, res, next) => {
  try {
    const allowedChannels = process.env.SLACK_CHANNELS.split(',')
    const channel = req.query.channel ? req.query.channel : false

    // Require channel argument.
    if (!channel) next('Channel argument required')

    // Disallow sneaking into unapproved channels.
    if (!allowedChannels.includes(channel)) next('Invalid channel')

    const usersPromise = userProfiles.loadUsers()
    const profilesPromise = userProfiles.allProfiles()
    const users = await usersPromise
    const profiles = await profilesPromise

    // Iterate the conversation.members call due to its pagination limit.
    const members = await userProfiles.loadChannelMembers(channel)

    res.send(members
      .map(data => users.find(user => data.includes(user.id)))
      .map(user => {
        const name = user.real_name.split(' ')
        const first = name[0]
        const last = name[1] ? ' ' + name[1][0] + '.' : ''

        let profile = {
          id: user.id,
          name: first + last,
          image: user.profile.image_512
        }

        const externalProfile = profiles.find(profile => profile.id === user.id)

        if (externalProfile) {
          profile = {
            ...profile,
            ...{
              location: externalProfile.locality ? externalProfile.locality : '',
              availability: externalProfile.availability ? externalProfile.availability : '',
              english: externalProfile.english ? externalProfile.english : '',
              titles: externalProfile.titles ? externalProfile.titles : [],
              languages: externalProfile.languages ? externalProfile.languages : [],
              skills: externalProfile.skills ? externalProfile.skills : [],
              citizenship: externalProfile.citizen ? externalProfile.citizen : '',
              drupal_bio: profiles[user.id] ? profiles[user.id].drupal_bio : '',
              wp_experience: profiles[user.id] ? profiles[user.id].wp_experience : '',
              wp_bio: profiles[user.id] ? profiles[user.id].wp_bio : ''
            }
          }
        }

        return profile
      }))
  } catch (e) {
    console.log(e)

    next(e)
  }
}
