const { jobsRef } = require("../util/firebase");

module.exports = async (payload, type) => {
  const formVal = Object.keys(payload.view.state.values).reduce((acc, key) => {
    const objKey = payload.view.state.values;
    if (objKey[key].val.type === "static_select") {
      acc[key] = objKey[key].val.selected_option.value;
    } else if (objKey[key].val.type === "datepicker") {
      acc[key] = objKey[key].val.selected_date;
    } else {
      acc[key] = objKey[key].val.value;
    }
    return acc;
  }, {});

  console.log(formVal);

  try {
    if (type === "add") {
      return await jobsRef()
        .add(formVal)
        .then(res => {
          return { status: res.status };
        })
        .catch(e => console.log(e));
    }
    if (type === "edit") {
      return await jobsRef()
        .doc("dnkkDDZEsWVOouPTIvi5")
        .set(formVal, { merge: true })
        .then(res => ({ status: res.status }))
        .catch(e => console.log(e));
    }
  } catch (err) {
    if (err) console.log(err);
  }
};
