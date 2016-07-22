'use strict'
require('dotenv').load()
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const cheerio = require('cheerio')
const Url = require('url')

const webdriverio = require('webdriverio')
const options = { desiredCapabilities: { browserName: 'chrome' } }

module.exports = function (userIds) {
  const client = webdriverio.remote(options)
  
  function login () {
    return client
      .init()
      .url(`https://www.goodreads.com`)
      .setValue('#userSignInFormEmail', process.env.EMAIL)
      .setValue('#user_password', process.env.PASSWORD)
      .click('input[value="Sign in"]')
  }




}
