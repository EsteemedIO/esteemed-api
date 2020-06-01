const url = require('url')

module.exports = async submission => {
  let errors = []

  if (submission.linkedin) {
    const linkedin = url.parse(submission.linkedin)
    const linkedin_valid = (linkedin.host == 'linkedin.com') && (linkedin.pathname.split('/')[1] == 'in')
    if (!linkedin_valid) errors.push({ "name": "linkedin", "error": "This is not a valid LinkedIn URL" })
  }

  if (submission.drupal_profile) {
    const drupal = url.parse(submission.drupal_profile)

    // Apply heuristics.
    const drupal_valid = (drupal.host == 'drupal.org' || drupal.host == 'www.drupal.org') && (drupal.pathname.split('/')[1] == 'u')

    // Capture errors.
    if (!drupal_valid) errors.push({ "name": "drupal_profile", "error": "This is not a valid Drupal URL" })
  }

  return errors
}
