module.exports.flatten = data => {
  return Object.keys(data).reduce((acc, key) => {
      const item = data[key]

      if (
        item.val.type === "static_select" ||
        item.val.type === "radio_buttons"
      ) {
        acc[key] = item.val.selected_option.value
      } else if (item.val.type === "multi_static_select") {
        acc[key] = item.val.selected_options.map(option => option.value)
      } else if (item.val.type === "datepicker") {
        acc[key] = item.val.selected_date
      } else {
        acc[key] = item.val.value
      }

      return acc
    }, {})
}
