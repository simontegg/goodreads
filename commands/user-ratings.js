'use strict'
require('dotenv').load()
const pull = require('pull-stream')
const cheerio = require('cheerio')
const Url = require('url')
const superagent = require('superagent')
const extend = require('deep-extend')
const range = require('array-range')
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

function makeUrl (username) {
  return Url.format({
    protocol: 'http',
    hostname: 'www.librarything.com',
    pathname: 'catalog_bottom.php/',
    query: { view: username }
  })
}

function makePaginatedUrl (username, n) {
  return Url.format({
    protocol: 'http',
    hostname: 'www.librarything.com',
    pathname: `catalog_bottom.php`,
    query: { 
      view: username, 
      sort: 'rating',
      offset: n * 20
    } 
  })
}

function getPageCount (html) {
  const $ = cheerio.load(html)
  return parseInt($('#pages > span:last-child > a').text()) 
}


module.exports = function (username) {
  return pull(
    pull.once(username),
    pull.map(makeUrl),
    pull.asyncMap(superagent.get),
    pull.map(res => res.text),
    pull.map(ini => {
      console.log('ini', ini)
      return ini
    }),

    pull.asyncMap((html, cb) => {
      pull(
        pull.values(range(0, getPageCount(html))),
        delay(1001),
        pull.map(n => makePaginatedUrl(username, n)),
        pull.map(url => {
          console.log('url', url)
          return url
        }),
        pull.asyncMap(superagent.get),
        pull.map(res => res.text),
        pull.map(getRatings),
        pull.flatten(),
        pull.map(rating => extend(rating, { username: username })),
        pull.collect((err, ratings) => {
          cb(null, ratings)
        })
      )
    }),
    pull.flatten()
  )
}
