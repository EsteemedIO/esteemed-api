export default values => {
  const errors = []

  if (values.linkedin) {
    const linkedin = new URL(values.linkedin)
    const linkedinValid = (linkedin.host === 'linkedin.com') && (linkedin.pathname.split('/')[1] === 'in')
    if (!linkedinValid) errors.push({ name: 'linkedin', error: 'This is not a valid LinkedIn URL' })
  }

  if (values.drupal_profile) {
    const drupal = new URL(values.drupal_profile.val.value)

    // Apply heuristics.
    const drupalValid = (drupal.host === 'drupal.org' || drupal.host === 'www.drupal.org') && (drupal.pathname.split('/')[1] === 'u')

    // Capture errors.
    if (!drupalValid) errors.push({ name: 'drupal_profile', error: 'This is not a valid Drupal URL' })
  }

  return errors
}
