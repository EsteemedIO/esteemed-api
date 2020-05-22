const api = require('./api')()
const defaultHome = require('./blocks/defaultHome')
const drupal = require('./blocks/drupal')
const wp = require('./blocks/wp')

exports.handler = async event => {
  const homeOptions = defaultHome.reduce((acc, item) => {
    if (item.accessory.options) {
      const options = item.accessory.options.reduce((optAccum, optItem) => {
        optAccum[optItem.value] = optItem.text.text
        return optAccum
      }, {})

      return { ...acc, ...options }
    }

    return acc
  }, {})

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(homeOptions),
  }
}
