module.exports = submission => {
  const errors = []

  if (submission.linkedin) {
    const linkedin = new URL(submission.linkedin)
    const linkedinValid = (linkedin.host === 'linkedin.com') && (linkedin.pathname.split('/')[1] === 'in')
    if (!linkedinValid) errors.push({ name: 'linkedin', error: 'This is not a valid LinkedIn URL' })
  }

  if (submission.drupal_profile) {
    const drupal = new URL(submission.drupal_profile)

    // Apply heuristics.
    const drupalValid = (drupal.host === 'drupal.org' || drupal.host === 'www.drupal.org') && (drupal.pathname.split('/')[1] === 'u')

    // Capture errors.
    if (!drupalValid) errors.push({ name: 'drupal_profile', error: 'This is not a valid Drupal URL' })
  }

  return errors
}
