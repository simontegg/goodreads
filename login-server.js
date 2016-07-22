'use strict'
require('dotenv').load()
const http = require('http')
const Router = require('router')
const Goodreads = require('goodreads')
const finalHandler = require('finalhandler')
const extend = require('deep-extend')
const url = require('url')

const Users = require('./db').users

const merge = (obj1, obj2) => {
  if (obj1) {
    extend(obj1, obj2)
    return obj1
  } else {
    return obj2
  }
}

const fakeSession = {}
const gr = new Goodreads.client({ 
  key: process.env.KEY,
  secret: process.env.SECRET
})

function routerFunc (done) {
  const router = Router()
  router.get('/oauth', (req, res) => {
    console.log('oauth')
    gr.requestToken(resp => {
      fakeSession.oauthToken = resp.oauthToken
      fakeSession.oauthTokenSecret = resp.oauthTokenSecret
      res.writeHead(301, { 'Location': resp.url })
      res.end()
    })
  })

  router.get('/callback', (req, res) => {
    const params = url.parse(req.url, true)
    gr.processCallback(
      fakeSession.oauthToken, 
      fakeSession.oauthTokenSecret,
      params.query.authorize,
      resp => {
        Users.get(resp.userid, (err, user) => {
          Users.put(resp.userid, merge(user, resp), err => {
            done()
          })
        })
        res.end()
      }
    )
  })

  return router
}

module.exports = function (callback) {
  const server = http.createServer((req, res) => {
    routerFunc(done)(req, res, finalHandler(req, res))
  })
  
  function done () {
    callback()
    server.close()
  }

  server.listen(3000)
  return server
}
