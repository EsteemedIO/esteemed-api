export function getForm(userId) {
  const action = `https://esteemed-api-97dnt.ondigitalocean.app/submit-referral`

  const fields = [
    {
      id: 'email',
      label: 'Email Address',
      type: 'email'
    },
    {
      id: 'first',
      label: 'First Name',
      type: 'text'
    },
    {
      id: 'last',
      label: 'Last Name',
      type: 'text'
    },
    {
      id: 'city',
      label: 'City',
      type: 'text'
    },
    {
      id: 'country',
      label: 'Country',
      type: 'text'
    },
    {
      id: 'acquia_exams',
      label: 'Passed any Acquia exams? Check all that apply.',
      type: 'select_multiple',
      options: [
        {
          id: 'acquia_platform',
          label: 'Acquia Platform Certification',
        },
        {
          id: 'drupal_7',
          label: 'Drupal 7 Certification',
        },
        {
          id: 'drupal_8',
          label: 'Drupal 8 Certification',
        },
        {
          id: 'drupal_9',
          label: 'Drupal 9 Certification',
        }
      ]
    },
    {
      id: 'skills',
      label: "Select the skills you're most comfortable with.",
      type: 'select_multiple',
      options: [
        {
          id: 'front_end',
          label: 'Front-end'
        },
        {
          id: 'back_end',
          label: 'Back-end'
        },
        {
          id: 'site_builder',
          label: 'Site Builder'
        },
        {
          id: 'theming',
          label: 'Theming'
        },
        {
          id: 'full_stack',
          label: 'Full-Stack'
        },
      ]
    }
  ]

  const referer_field = `<input type="hidden" value="${userId}">`

  const form_fields = fields.reduce((acc, field) => {
    let output = `\t<label for="${field.id}">${field.label}</label>\n`
    switch (field.type) {
      case 'text':
      case 'email':
        output += `\t<input type="${field.type}" value="" name="${field.id}" id="${field.id}">\n`
        break
      case 'select_multiple':
        output += '\t<ul>\n'
        output += field.options.reduce((acc, option) => {
          acc = acc + `\t\t<li>\n\t\t\t<input type="checkbox" value="${option.label}" name="${field.id}[${option.id}]">\n\t\t\t<label for="${option.id}">${option.label}</label>\n\t\t</li>\n`
          return acc
        }, '')
        output += '\t</ul>'
        break
    }

    acc = acc + output

    return acc
  }, '')

  const submit = `<input type="submit" value="Submit">`

  return `<form action="${action}">\n${form_fields}\n\t${referer_field}\n\t${submit}\n</form>`
}
