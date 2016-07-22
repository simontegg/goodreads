'use strict'
require('dotenv').load()
const Router = require('router')
const Goodreads = require('goodreads')
const request = require('request')
const superagent = require('superagent')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const cheerio = require('cheerio')
const Url = require('url')
const range = require('array-range')

const webdriverio = require('webdriverio')
const options = { desiredCapabilities: { browserName: 'chrome' } }

function extractUserWhoRate (html) {
  const $ = cheerio.load(html)
  return $('.review')
  .filter(function (i, elem) {
    return $(this).find('.p10').length >= 4
  })
  .map(function (i, elem) {
    return $(elem).find('.user').attr('href').replace('/user/show/', '')
  })
  .get()
}

function extractGenres (html) {


}


function book (bookId, callback) {
  const userStream = Pushable()
  const genreStream = Pushable()
  const client = webdriverio.remote(options)
  client
  .init()
  .url(`https://www.goodreads.com/book/show/${bookId}`)
  .getHTML('body')
  .then(html => {

    userStream.push(extractUserWhoRate(html))
  })
  .isExisting('a=2')
  .then(bool => client.click('a=2'))
  .pause(2000)
  .getHTML('#other_reviews')
  .then(html => userStream.push(extractUserWhoRate(html)))
  .isExisting('a=3')
  .then(bool => client.click('a=3'))
  .pause(2000)
  .getHTML('#other_reviews')
  .then(html => userStream.push(extractUserWhoRate(html)))

  return pull(userStream, pull.flatten())
}

module.exports = book
