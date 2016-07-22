'use strict'
const request = require('superagent') 
const goodreads = require('goodreads')
const vorpal = require('vorpal')()
const launcher = require('browser-launcher2')
const pull = require('pull-stream')

// commands
const book = require('./commands/book')

const LoginServer = require('./login-server')


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
  .command('book <bookId>', "fetches a book's info")
  .action(function (args, callback) {
    const userStream = book(args.bookId)
    pull(
      userStream,
      pull.drain(userId => {
        console.log('userId', userId) 
      })
    )

  })

vorpal
.delimiter('>>')
.show()
