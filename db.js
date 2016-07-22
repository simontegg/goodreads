'use strict'
const level = require('level-party')
const sublevel = require('level-sublevel')
const db = sublevel(level(`${__dirname}/data`, { valueEncoding: 'json' }))
const users = db.sublevel('users')
const ratings = db.sublevel('ratings')

exports.db = db
exports.users = users
exports.ratings = ratings
