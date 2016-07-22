'use strict'
require('dotenv').load()
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const cheerio = require('cheerio')
const Url = require('url')
const Ratings = require('../db').ratings

const webdriverio = require('webdriverio')
const options = { desiredCapabilities: { browserName: 'chrome' } }

function userId ($elem) {
  return $elem
    .find('.user')
    .attr('href')
    .replace('/user/show/', '')
    .split('-')[0]
}

function rating ($elem) {
  return $elem.find('.p10').length
}

function extractUserWhoRate (html) {
  const $ = cheerio.load(html)
  return $('.review')
    .filter(function (i, elem) {
      return $(this).find('.p10').length >= 4
    })
    .map(function (i, elem) {
      return { userId: userID($(elem)), rating: rating($elem) } 
    })
    .get()
}

function book (bookId, callback) {
  const users = Pushable()
  const client = webdriverio.remote(options)
  
  client
  .init()
  .url(`https://www.goodreads.com/book/show/${bookId}?key=${process.env.KEY}`)
  .getHTML('body')
  .then(html => users.push(extractUserWhoRate(html)))
  .isExisting('a=2')
  .then(bool => client.click('a=2'))
  .pause(3000)
  .getHTML('#other_reviews')
  .then(html => users.push(extractUserWhoRate(html)))
  .isExisting('a=3')
  .then(bool => client.click('a=3'))
  .pause(3000)
  .getHTML('#other_reviews')
  .then(html => users.push(extractUserWhoRate(html)))
  .then(() => {
  })
  .close()

  pull(
    users,
    pull.flatten(),
    pull.map(rating => {
      return extend(rating, { bookId: args.bookId })
    }),
    pull.map(rating => {
      return {
        type: 'put',
        key: `${rating.userId}-${rating.bookId}`,
        value: rating
      }
    }),
    pull.collect(ops => {
      console.log('ops', ops)
      Ratings.batch(ops, err => {
        callback()            
      })       
    })
  )
}

module.exports = book
