const api = require('./api')()
const { profilesRef } = require('./firebase')

module.exports.loadUsers = () => {
  return api.get('users.list')
    .then(({ data }) => data.members.filter(member => !member.is_bot))
    //.then(data => data.filter(member => !member.is_admin))
    .then(data => data.filter(member => !member.deleted))
    .then(data => data.filter(member => member.id != 'USLACKBOT'))
}

module.exports.loadChannelMembers = (channel, cursor) => {
  let params = {
    channel: channel,
    limit: 1000,
  }

  if (cursor != '') {
    params.cursor = cursor
  }

  return api.get('conversations.members', { params: params })
    .then(({ data }) => ({
        members: data.members,
        cursor: data.response_metadata.next_cursor,
        more: (data.response_metadata.next_cursor != '')
      }))
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
