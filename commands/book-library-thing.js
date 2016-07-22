'use strict'
require('dotenv').load()
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const cheerio = require('cheerio')
const Url = require('url')
const Ratings = require('../db').ratings
const superagent = require('superagent')

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
  return pull(
    pull.values([8, 9, 10]),
    pull.map(rating => {
      return {
        $elem: $(`img[src="http://pics.cdn.librarything.com/pics/s${rating}.gif"]`),
        rating: rating
      }
    }),
    pull.map(ref => {
      // console.log(ref.$elem.siblings('a').map($elem => ))
      return ref.$elem.siblings('a')
      //  .map((i, $elem) => console.log($elem))
       
        .map(function (i, elem) {
          return $(this).text() 
        })
        .get()
        .map(username => ({ username: username, rating: ref.rating }))
    }),
    pull.flatten()
  )
}

function book (bookId) {
  return pull(
    pull.once(bookId),
    pull.map(bookId => `http://www.librarything.com/work/${bookId}/members`),
    pull.asyncMap(superagent.get),
    pull.map(res => res.text),
    pull.map(html => {
      return pull(
        extractUserWhoRate(html),
        pull.log()
      )
    })
  )


}

module.exports = book
