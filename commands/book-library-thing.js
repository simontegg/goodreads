'use strict'
require('dotenv').load()
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const cheerio = require('cheerio')
const Url = require('url')
const Ratings = require('../db').ratings
const superagent = require('superagent')
const extend = require('deep-extend')

// const webdriverio = require('webdriverio')
// const options = { desiredCapabilities: { browserName: 'chrome' } }

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
  return [8, 9, 10]
    .map(rating => {
      return {
        $elem: $(`img[src="http://pics.cdn.librarything.com/pics/s${rating}.gif"]`),
        rating: rating
      }
    })
    .map(ref => {
      return ref.$elem.siblings('a')
        .map(function (i, elem) {
          return $(this).text() 
        })
        .get()
        .map(username => ({ username: username, rating: ref.rating }))
    })
}

function book (bookId) {
  return pull(
    pull.once(bookId),
    pull.map(bookId => `http://www.librarything.com/work/${bookId}/members`),
    pull.asyncMap(superagent.get),
    pull.map(res => res.text),
    pull.map(extractUserWhoRate),
    pull.flatten(),
    pull.flatten(),
    pull.map(rating => extend(rating, { bookId: bookId }))
  )


}

module.exports = book
