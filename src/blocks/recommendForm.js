export default [
  {
    type: 'input',
    element: {
      type: 'plain_text_input',
      action_id: 'val',
      placeholder: {
        type: 'plain_text',
        text: 'John Doe'
      }
    },
    label: {
      type: 'plain_text',
      text: 'Name'
    },
    block_id: 'name'
  },
  {
    type: 'input',
    element: {
      type: 'plain_text_input',
      action_id: 'val',
      placeholder: {
        type: 'plain_text',
        text: 'johndoe@mail.com'
      }
    },
    label: {
      type: 'plain_text',
      text: 'Email'
    },
    block_id: 'email'
  },
  {
    type: 'input',
    element: {
      type: 'plain_text_input',
      action_id: 'val',
      placeholder: {
        type: 'plain_text',
        text: '555-555-1234'
      }
    },
    label: {
      type: 'plain_text',
      text: 'Phone Number'
    },
    block_id: 'phone'
  }
]
