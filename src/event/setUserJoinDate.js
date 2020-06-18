const { profilesRef } = require('../util/firebase')

module.exports = async user => {
  const date = new Date(user.updated * 10000)

  // Add join date.
  await profilesRef().doc(user.id)
    .set({join_date: date.toISOString().split('T')[0]}, { merge: true })
    .then(res => console.log(res))
    .catch(e => console.log(e))

  return { statusCode: 200, body: '' }
}
