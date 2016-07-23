'use strict'
const g = require('ger')

const esm = new g.MemESM()
const ger = new g.GER(esm)

ger.initialize_namespace('books')

module.exports = function (ratings, callback) {
  const actions = ratings.map(rating => {
    return {
      namespace: 'books',
      person: rating.username,
      action: String(rating.rating),
      thing: rating.book,
      expires_at: '2020-06-06'
    }
  })

  ger.events(actions)
    .then(() => {
      callback(null, ger)
    })
}
