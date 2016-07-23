'use strict'
const g = require('ger')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const esm = new g.MemESM()
const ger = new g.GER(esm)


ger.initialize_namespace('books')

exports.train = function (actions) { 
  const trained = Pushable()
  ger.events(actions)
    .then(() => {
      console.log('trained')
      trained.push(ger)
    })
  return trained
}

exports.recommend = (person) => (ger, cb) => {
  ger.recommendations_for_person(
    'books',
    person,
    { 
      actions: { '1': -1, '2': -0.5, '3': 0, '4': 0.5, '5': 1 },
      filter_previous_actions: ['1', '2', '3', '4', '5']
    }
  )
  .then(recs => {
    cb(null, recs)
  })
}
