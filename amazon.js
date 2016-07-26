'use strict'
const pull = require('pull-stream')
const Nightmare = require('nightmare')
require('nightmare-iframe-manager')(Nightmare)
const userAgentStrings = require('./user-agent-strings')
const shuffle = require('lodash.shuffle')

const descriptionSelector = '.productDescriptionWrapper'



module.exports = function (isbn) {
  const nightmare = Nightmare({ show: true })
  
  return pull(
    pull.once(amazonBookUrl(isbn)),
    pull.asyncMap((url, cb) => {
      nightmare
        .useragent(shuffle(userAgentStrings)[0])
        .goto(url)
        .enterIFrame('#product-description-iframe')
        .evaluate(descriptionSelector => {
          return document.querySelector(descriptionSelector).outerHTML
        }, descriptionSelector)
        .end()
        .then(text => cb(null, text))
    }),
    pull.map(text => {
      console.log('text', text)
      return text
    })
  )
}

function amazonBookUrl (isbn) {
  return `https://www.amazon.com/dp/${isbn}`
}
