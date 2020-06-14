const api = require('./../util/api')()
const { profilesRef } = require('./../util/firebase')

module.exports.loadUsers = () => {
  return api.get('users.list')
    .then(({ data }) => data.members.filter(member => !member.is_bot))
    //.then(data => data.filter(member => !member.is_admin))
    .then(data => data.filter(member => !member.deleted))
    .then(data => data.filter(member => member.id != 'USLACKBOT'))
}

module.exports.loadChannelMembers = channel => {
  return api.get('conversations.members', {
      params: {
        channel: channel
      }
    })
    .then(({ data }) => data.members)
}

module.exports.allProfiles = () => {
  return profilesRef().get()
    .then(snapshot => snapshot.docs.reduce((obj, item) => {
      obj[item.id] = item.data()
      return obj
    }, {}))
    .catch(e => { console.log('Error getting documents', e) })
}

module.exports.getUser = userId => {
  return api.get('users.info', {
    params: {
      user: userId
    }
  }).then(({ data }) => data)
}

module.exports.format = ({ real_name, email, phone, title })=> {
  return "Name: " + real_name +
    "\nEmail: " + email +
    "\nPhone: " + phone +
    "\nTitle: " + title
}
