'use strict'
const level = require('level-party')
const sublevel = require('level-sublevel')
const db = sublevel(level(`${__dirname}/data`, { valueEncoding: 'json' }))
const users = db.sublevel('users')

exports.db = db
exports.users = users
