'use strict'
const goodreads = require('goodreads')
const vorpal = require('vorpal')()
const launcher = require('browser-launcher2')
const pull = require('pull-stream')
const pl = require('pull-level')
const delay = require('pull-delay')
const extend = require('deep-extend')
const request = require('superagent') 
require('superagent-auth-bearer')(request)
const oauth = require('oauth').OAuth
const many = require('pull-many')
const uniqBy = require('lodash.uniqby')
// db
const Users = require('./db').users
const Ratings = require('./db').ratings

// commands
const book = require('./commands/book-library-thing')
const compare = require('./commands/compare')
const userRatings = require('./commands/user-ratings')
const train = require('./commands/recommend').train
const recommend = require('./commands/recommend').recommend
const tagged = require('./commands/tagged')
const LoginServer = require('./login-server')
let currentUserId


const opts = {
  browser: 'chrome'
}

function activeUsers (actions, username) {
  return uniqBy(actions, action => {
      return action.person
    })
    .map(action => action.person)
    .filter(username => username !== username)
}

function ratingToAction (rating) {
  return {
    namespace: 'books',
    person: rating.username,
    action: String(rating.rating),
    thing: rating.book,
    expires_at: '2020-06-06'
  }
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
.command('book <bookId> <username>, [tags...]', "fetches some user ratings who rate the book 4 or 5 stars")
.action(function (args, callback) {

  pull(
    book(args.bookId),
    pull.asyncMap((rating, cb) => {
      pull(
        many([
          compare(rating.username, args.username),
          compare(args.username, rating.username)
        ]),
        pull.unique(rating => rating.username + rating.book),
          pull.collect((err, ratings) => {
          cb(null, ratings)
        })
      )
    }),
    delay(1001),
    pull.flatten(),
    pull.map(ratingToAction),
    pull.collect((err, actions) => {
      console.log('actions 0', actions)
      pull(
        train(actions),
        pull.drain(ger => {
          console.log('ended', ger)
          pull(
            tagged(activeUsers(actions, args.username), args.tags),
            pull.map(r => {
              console.log('r', r)
              return r
            }),
            pull.map(ratingToAction),
            pull.map(action => {
              console.log('action', action)
              return action
            }),
            pull.collect((err, actions) => {
              console.log('actions', actions)
              pull(
                train(actions),
                pull.asyncMap(recommend(args.username)),
                pull.drain(recommendations => {
                  console.log('recommendations', recommendations)
                })
              )
            })
          )
        })
      )
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
        //         callback()
      })
    )
  })

  vorpal
  .command('ratings <username>', 'fetch user ratings')
  .action(function (args, callback) {
    userRatings(args.username, callback)

    //       pull.map(rating => {
    //         console.log('rating', rating)
    //         return {
    //           type: 'put',
    //           key: `${rating.username}-${rating.book}`,
    //           value: rating
    //         }
    //       }),
    //       pull.map(op => {
    //         console.log('op', op)
    //         return [
    //           op,
    //           {
    //             type: put,
    //             key: `~username~${op.value.rating.username}`,
    //             value: { key: op.key }
    //           },
    //           {
    //             type: put,
    //             key: `~book~${op.value.rating.book}`,
    //             value: { key: op.key }
    //           }
    //         ]
    //       }),
    //       pull.flatten(),
    //       pull.collect((err, ops) => {
    //         console.log('ops', ops)
    //         callback()
    //       })
    //     )
  })

  vorpal
  .delimiter('>>')
  .show()
