'use strict'
require('dotenv').load()
const pull = require('pull-stream')
const cheerio = require('cheerio')
const Url = require('url')
const superagent = require('superagent')
const extend = require('deep-extend')
const delay = require('pull-delay')

function getRating ($row, $) {
  return $row
    .find('.rw > img[src="http://pics.cdn.librarything.com/pics/s-s.gif"]')
    .length
}

function getBookid ($row) {
  return $row
    .find('.lt-title')
    .attr('href')
    .split('/')[2]
}

function getUsername ($) {
  return $('div.searchPieces:nth-child(1) > b:nth-child(1) > a:nth-child(1)').text()
}

function getRatings (html) {
  const $ = cheerio.load(html)
  return $('.cat_catrow')
    .map(function (i, elem) {
      console.log(getUsername($))
      return {
        username: getUsername($), 
        rating: getRating($(this)),
        book: getBookid($(this))
      }
    }).get()
}

function makeUrl (username, tag) {
  return Url.format({
    protocol: 'http',
    hostname: 'www.librarything.com',
    pathname: 'catalog_bottom.php',
    query: { view: username, tag: tag, sort: 'rating' }
  })
}

function matrixUrls (usernames, tags) {
  return usernames.map(username => {
    return tags.map(tag => {
        return makeUrl(username, tag)
    })
  })
}


module.exports = function (usernames, tags) {
  return pull(
    pull.values(matrixUrls(usernames, tags.concat(['(no tag)']))),
    pull.flatten(),
    delay(1001),
    pull.asyncMap(superagent.get),
    pull.map(res => res.text),
    pull.map(getRatings),
    pull.flatten(),
    pull.filter(rating => rating.rating > 0)
  )
}
