export function get(data) {
  return Object.keys(data).reduce((acc, key) => {
    const item = data[key]

    if (
      item.val.type === 'static_select' ||
      item.val.type === 'radio_buttons'
    ) {
      acc[key] = item.val.selected_option.value
    } else if (item.val.type === 'multi_static_select') {
      acc[key] = item.val.selected_options.map(option => option.value)
    } else if (item.val.type === 'datepicker') {
      acc[key] = item.val.selected_date
    } else {
      acc[key] = item.val.value
    }

    return acc
  }, {})
}

export function set(blocks, record) {
  return blocks.reduce((accum, block) => {
    if (block.accessory && record[block.accessory.action_id] !== undefined) {
      const value = record[block.accessory.action_id]

      if (value.length > 0 || value.value) {
        if (block.accessory.type === 'static_select') {
          block.accessory.initial_option = block.accessory.options.find(option => option.value === value)
        } else if (block.accessory.type === 'datepicker') {
          block.accessory.initial_date = value
        } else {
          block.accessory.initial_options = block.accessory.options.filter(option => value.includes(option.value))
        }
      }
    }

    if (block.element && record[block.block_id] !== undefined) {
      const value = record[block.block_id]

      if (value.length > 0 || value.value) {
        switch (block.element.type) {
          case 'static_select':
            block.element.initial_option = block.element.options.find(option => option.value === value)
            break
          case 'plain_text_input':
            block.element.initial_value = value
            break
          case 'datepicker':
            block.element.initial_date = value
            break
          default:
            block.element.initial_options = block.element.options.filter(option => value.includes(option.value))
        }
      }
    }

    accum.push(block)

    return accum
  }, [])
}
