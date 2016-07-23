'use strict'
require('dotenv').load()
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const cheerio = require('cheerio')
const Url = require('url')
const superagent = require('superagent')
const extend = require('deep-extend')

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

function getRatings (html) {
  const $ = cheerio.load(html)
  return $('.cat_catrow')
    .map(function (i, elem) {
      return {
        rating: getRating($(this)),
        book: getBookid($(this))
      }
    }).get()
}

function makeUrl (usernames) {
  return Url.format({
    protocol: 'http',
    hostname: 'www.librarything.com',
    pathname: 'catalog_bottom.php',
    query: { view: usernames[0], compare: usernames[1] }
  })
}


module.exports = function (username1, username2) {
  console.log(username1)
  return pull(
    pull.once([username1, username2]),
    pull.map(makeUrl),
    pull.asyncMap(superagent.get),
    pull.map(res => res.text),
    pull.map(getRatings),
    pull.flatten(),
    pull.filter(rating => rating.rating > 0),
    pull.map(rating => {
      return extend(rating, { username: username1 })
    })
  )





}
