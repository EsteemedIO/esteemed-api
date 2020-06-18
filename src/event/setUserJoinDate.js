const api = require('../util/api')()
const { profilesRef } = require('../util/firebase')

// const profiles = require('./../util/userProfiles')

module.exports = async user => {
	const date = new Date(user.updated * 10000)

	// Add Join Date
	await profilesRef().doc(user.id).set({join_date: date.toISOString().split('T')[0]}, { merge: true })
		.then(res => console.log(res))
		.catch(e => console.log(e))

	// const users = await profiles.loadUsers()

	// users.map(async (user) => { 
	// 	await profilesRef().doc(user.id).set({join_date: new Date(user.updated * 1000).toISOString().split('T')[0]}, { merge: true })
	// 	.then(res => console.log(res))
	// 	.catch(e => console.log(e)) 

	// 	return user
	// })

	return { statusCode: 200, body: '' }
}