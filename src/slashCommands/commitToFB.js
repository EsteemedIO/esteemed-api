const dynamodb = require("../util/dynamodb")

module.exports = async (payload, type, jobID, user) => {
  try {
    // action to handle applicant
    if (type === "apply_btn") {
      const applicant = {
        id: user.id,
        name: user.real_name,
      }

      // search FB to see if applicants field exists
      var params = {
        TableName: 'jobs',
        Key: {
          id: jobID
        }
      }

      const checkJob = await dynamodb.get(params).promise()
        .then(({ Item }) => Item)
        .catch(e => console.log(e))

      if (!checkJob.applicants) {
        console.log("CREATED")
        let params = {
          TableName: "jobs",
          Key: {
            id: jobID
          },
          UpdateExpression: `set applicants = :applicant`,
          ExpressionAttributeValues: {
            ':applicant': [ applicant ]
          }
        }

        return await dynamodb.update(params).promise()
      } else {
        console.log("ADDED")
        let params = {
          TableName: "jobs",
          Key: {
            id: jobID
          },
          UpdateExpression: `set applicants = :applicants`,
          ExpressionAttributeValues: {
            //':applicants': fb.firestore.FieldValue.arrayUnion(applicant),
            ':applicants': [ applicant ],
          }
        }

        return await dynamodb.update(params).promise()
      }
    }

    // parsing the payload to set up document to send to fb (this can bbe from the edit or the add)
    const formVal = Object.keys(payload.view.state.values).reduce(
      (acc, key) => {
        const objKey = payload.view.state.values
        if (
          objKey[key].val.type === "static_select" ||
          objKey[key].val.type === "radio_buttons"
        ) {
          acc[key] = objKey[key].val.selected_option.value
        } else if (objKey[key].val.type === "multi_static_select") {
          acc[key] = objKey[key].val.selected_options.map(
            option => option.value
          )
        } else if (objKey[key].val.type === "datepicker") {
          acc[key] = objKey[key].val.selected_date
        } else {
          acc[key] = objKey[key].val.value
        }
        return acc
      },
      {}
    )

    //* ===============================================//
    if (type === "recommend") {
      const recommendie = {
        id: user.id,
        name: user.real_name,
      }
      formVal.recommended_by = recommendie

      // search FB to see if applicants field exists
      var params = {
        TableName: 'jobs',
        Key: {
          id: jobID
        }
      }

      const checkJob = await dynamodb.get(params).promise()
        .then(({ Item }) => Item)
        .catch(e => console.log(e))

      if (!checkJob.recommended_applicants) {
        console.log("CREATED")
        let params = {
          TableName: "jobs",
          Key: {
            id: jobID
          },
          UpdateExpression: `set recommended_applicants = :recommended_applicants`,
          ExpressionAttributeValues: {
            ':recommended_applicants': [ formVal ]
          }
        }

        return await dynamodb.update(params).promise()
      } else {
        console.log("ADDED")
        let params = {
          TableName: "jobs",
          Key: {
            id: jobID
          },
          UpdateExpression: `set recommended_applicants = :recommended_applicants`,
          ExpressionAttributeValues: {
            //':recommended_applicants': fb.firestore.FieldValue.arrayUnion(formVal),
            ':recommended_applicants': [ formVal ],
          }
        }

        return await dynamodb.update(params).promise()
      }
    }
    //* ===============================================//

    //* ===============================================//
    if (type === "notes") {
      const author = {
        id: user.id,
        name: user.real_name,
      }
      formVal.author = author

      // search FB to see if applicants field exists
      var params = {
        TableName: 'jobs',
        Key: {
          id: jobID
        }
      }

      const checkJob = await dynamodb.get(params).promise()
        .then(({ Item }) => Item)
        .catch(e => console.log(e))

      if (!checkJob.notes) {
        console.log("CREATED")
        let params = {
          TableName: "jobs",
          Key: {
            id: jobID
          },
          UpdateExpression: `set notes = :notes`,
          ExpressionAttributeValues: {
            ':notes': [ formVal ]
          }
        }

        return await dynamodb.update(params).promise()
          .catch(e => console.log(e))
      } else {
        console.log("ADDED")
        let params = {
          TableName: "jobs",
          Key: {
            id: jobID
          },
          UpdateExpression: `set notes = :notes`,
          ExpressionAttributeValues: {
            //':notes': fb.firestore.FieldValue.arrayUnion(formVal),
            ':notes': [ formVal ],
          }
        }

        return await dynamodb.update(params).promise()
      }
    }

    //* ===============================================//

    if (type === "add" || type == "edit") {
      formVal.job_active = false
      // if we want to add a field for when the post was created
      //? formVal.dateAdded = moment().format("lll")
        let params = {
          TableName: "jobs",
          Item: formVal,
        }

        params.Item.id = jobID

        return await dynamodb.put(params).promise()
    }
  } catch (err) {
    if (err) console.log(err)
  }
}
