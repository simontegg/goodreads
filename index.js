'use strict'
const goodreads = require('goodreads')
const vorpal = require('vorpal')()
const launcher = require('browser-launcher2')
const pull = require('pull-stream')
const pl = require('pull-level')
const extend = require('deep-extend')
const request = require('superagent') 
require('superagent-auth-bearer')(request)
const oauth = require('oauth').OAuth

// db
const Users = require('./db').users
const Ratings = require('./db').ratings


// commands
const book = require('./commands/book-library-thing')
const compare = require('./commands/compare')
const LoginServer = require('./login-server')
let currentUserId


const opts = {
  browser: 'chrome'
}

vorpal
.command('login', 'launches login.')
.action(function (args, callback) {
  const loginServer = LoginServer(callback)
  launcher((err, launch) => {
    launch('http://localhost:3000/oauth', opts, (err, ps) => {
      console.log('launched')
    })
  })
})

vorpal
  .command('book <bookId> <username>', "fetches some user ratings who rate the book 4 or 5 stars")
  .action(function (args, callback) {
    pull(
      book(args.bookId),

      pull.map(rating => {
        console.log(rating)
        return {
          type: 'put',
          key: `${rating.username}-${rating.bookId}`,
          value: rating
        }
      }),
      pull.collect((err, ops) => {
        Ratings.batch(ops, err => {
          callback()
        })
      })
    )
  })

vorpal
  .command('compare <username1> <username2>', 'compares 2 users')
  .action(function (args, callback) {
    pull(
      compare(args.username1, args.username2),
      pull.collect((err, ratings) => {
        console.log('ratings', ratings)
        callback()
      })
    )
  })


vorpal
.delimiter('>>')
.show()
