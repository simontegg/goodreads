'use strict'
require('dotenv').load()
const pull = require('pull-stream')
const goodreads = require('./goodreads')


pull(
  pull.once([process.env.EMAIL, process.env.PASSWORD]),
  pull.asyncMap((signin, cb) => {
     goodreads(signin[0], signin[1], cb) 
  }),
  pull.drain(result => {
    console.log('result', result)
  })
)
