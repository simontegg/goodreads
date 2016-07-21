'use strict'
const request = require('superagent') 
const goodreads = require('goodreads')
const vorpal = require('vorpal')()
const launcher = require('browser-launcher2')

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

  //  callback()
})

vorpal
.delimiter('>>')
.show()
