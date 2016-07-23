'use strict'
require('dotenv').load()
const pull = require('pull-stream')
const cheerio = require('cheerio')
const Url = require('url')
const superagent = require('superagent')
const extend = require('deep-extend')
const range = require('array-range')
const delay = require('pull-delay')

const webdriverio = require('webdriverio')
const options = { desiredCapabilities: { browserName: 'chrome' } }

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
  const page = $('td.pbGroup').text()
  console.log('page', page)
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
    query: { view: username, sort: 'rating' }
  })
}

function makePaginatedUrl (username, n) {
  return Url.format({
    protocol: 'http',
    hostname: 'www.librarything.com',
    pathname: `catalog_bottom.php`,
    query: { 
      offset: n * 50,
      view: username, 
      sort: 'rating'
    } 
  })
}

function getPageCount (html) {
  const $ = cheerio.load(html)
  return parseInt($('#pages > span:last-child > a').text()) 
}


module.exports = function (username, callback) {
  pull(
    pull.once(username),
    pull.map(makeUrl),
    pull.asyncMap(superagent.get),
    pull.map(res => res.text),
    pull.asyncMap((html, cb) => {
      const client = webdriverio.remote(options)
        .init()
        .url(makeUrl(username))

      const first = getRatings(html)
        .map(rating => extend(rating, { username: username }))

      pull(
        pull.values(range(0, getPageCount(html))),
        pull.asyncMap((n, callback) => {
          client.then(() => {
            client
              .isExisting('a=next page')
              .click('a=next page')
              .pause(1001)
              .getHTML('body')
              .then(html => {
                callback(null, html)
              })
          })
        }),
        pull.map(getRatings),
        pull.flatten(),
        pull.map(rating => extend(rating, { username: username })),
        pull.drain((rating) => {
          
          console.log('ratings', rating, first.length)
          cb(null, first) 
        })
      )
    }),
    pull.flatten(),
    pull.map(rating => {
      console.log('rating', rating)
      return {
        type: 'put',
        key: `${rating.username}-${rating.book}`,
        value: rating
      }
    }),
    pull.map(op => {
      console.log('op', op)
      return [
        op,
        {
          type: put,
          key: `~username~${op.value.rating.username}`,
          value: { key: op.key }
        },
        {
          type: put,
          key: `~book~${op.value.rating.book}`,
          value: { key: op.key }
        }
      ]
    }),
    pull.flatten(),
    pull.map(op => {
      console.log('rs', op)
      return op
    }),
    pull.collect((err, ops) => {
      console.log('ops', ops)
      callback()
    })
  )


  //     pull(
  //       pull.values(range(0, getPageCount(html))),
  //       delay(2001),
  //       pull.map(n => makePaginatedUrl(username, n)),
  //   pull.map(url => {
  //     console.log('url', url)
  //     return url
  //   }),
  //       pull.asyncMap(superagent.get),
  //       pull.map(res => res.text),
  //       pull.map(getRatings),
  //       pull.flatten(),
  //       pull.map(rating => extend(rating, { username: username })),
  //       pull.collect((err, ratings) => {
  //         cb(null, ratings)
  //       })
  //     )
  //   }),
  //   pull.flatten()
}
