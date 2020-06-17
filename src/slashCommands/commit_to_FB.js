const { jobsRef } = require("../util/firebase");
const fb = require("firebase-admin");
const travisBuild = require("../util/travis");
const moment = require("moment");

module.exports = async (payload, type, jobID, user) => {
  try {
    // action to handle applicant
    if (type === "apply_btn") {
      const applicant = {
        id: user.id,
        name: user.real_name,
      };
      // search FB to see if applicants field exists
      const checkJob = await jobsRef()
        .doc(jobID)
        .get()
        .then(data => data.data())
        .catch(e => console.log(e));

      if (!checkJob.applicants) {
        console.log("CREATED");
        return await jobsRef()
          .doc(jobID)
          .update({ applicants: [applicant] }, { merge: true })
          .then(res => {
            return {
              status: res.status,
            };
          })
          .catch(e => console.log(e));
      } else {
        console.log("ADDED");
        return await jobsRef()
          .doc(jobID)
          .update({
            applicants: fb.firestore.FieldValue.arrayUnion(applicant),
          });
      }
    }

    // parsing the payload to set up document to send to fb (this can bbe from the edit or the add)
    const formVal = Object.keys(payload.view.state.values).reduce(
      (acc, key) => {
        const objKey = payload.view.state.values;
        if (
          objKey[key].val.type === "static_select" ||
          objKey[key].val.type === "radio_buttons"
        ) {
          acc[key] = objKey[key].val.selected_option.value;
        } else if (objKey[key].val.type === "multi_static_select") {
          acc[key] = objKey[key].val.selected_options.map(
            option => option.value
          );
        } else if (objKey[key].val.type === "datepicker") {
          acc[key] = objKey[key].val.selected_date;
        } else {
          acc[key] = objKey[key].val.value;
        }
        return acc;
      },
      {}
    );

    //* ===============================================//
    if (type === "recommend") {
      const recommendie = {
        id: user.id,
        name: user.real_name,
      };
      formVal.recommended_by = recommendie;
      // search FB to see if applicants field exists
      const checkJob = await jobsRef()
        .doc(jobID)
        .get()
        .then(data => data.data())
        .catch(e => console.log(e));

      if (!checkJob.recommended_applicants) {
        console.log("CREATED");
        return await jobsRef()
          .doc(jobID)
          .update({ recommended_applicants: [formVal] }, { merge: true })
          .then(res => {
            return {
              status: res.status,
            };
          })
          .catch(e => console.log(e));
      } else {
        console.log("ADDED");
        return await jobsRef()
          .doc(jobID)
          .update({
            recommended_applicants: fb.firestore.FieldValue.arrayUnion(formVal),
          });
      }
    }
    //* ===============================================//

    //* ===============================================//
    if (type === "notes") {
      const author = {
        id: user.id,
        name: user.real_name,
      };
      formVal.author = author;
      // search FB to see if applicants field exists
      const checkJob = await jobsRef()
        .doc(jobID)
        .get()
        .then(data => data.data())
        .catch(e => console.log(e));

      if (!checkJob.notes) {
        console.log("CREATED");
        return await jobsRef()
          .doc(jobID)
          .update({ notes: [formVal] }, { merge: true })
          .then(res => {
            return {
              status: res.status,
            };
          })
          .catch(e => console.log(e));
      } else {
        console.log("ADDED");
        return await jobsRef()
          .doc(jobID)
          .update({
            notes: fb.firestore.FieldValue.arrayUnion(formVal),
          });
      }
    }

    //* ===============================================//

    if (type === "add") {
      formVal.job_active = false;
      // if we want to add a field for when the post was created
      //? formVal.dateAdded = moment().format("lll");
      return await jobsRef()
        .add(formVal)
        .then(res => {
          return { status: res.status };
        })
        .catch(e => console.log(e));
    }
    if (type === "edit") {
      return await jobsRef()
        .doc(jobID)
        .set(formVal, { merge: true })
        .then(res => {
          if (formVal["job_active"] === "true") {
            // travisBuild();
          }
          return {
            status: res.status,
          };
        })
        .catch(e => console.log(e));
    }
  } catch (err) {
    if (err) console.log(err);
  }
};
