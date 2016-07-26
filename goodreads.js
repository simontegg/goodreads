'use strict'
const pull = require('pull-stream')
const Nightmare = require('nightmare')
require('nightmare-iframe-manager')(Nightmare)
const userAgentStrings = require('./user-agent-strings')
const shuffle = require('lodash.shuffle')

const descriptionSelector = '.productDescriptionWrapper'

module.exports = function (username, password, callback) {
  const nightmare = Nightmare({ show: true })
  nightmare
    .useragent(shuffle(userAgentStrings)[0])
    .goto('https://www.goodreads.com')
    //.cookies.clear()
    //.type('#userSignInFormEmail', username)
    //.type('#user_password', password)
    //.click('input[value="Sign in"]')
    .goto('https://www.goodreads.com/friend')
    .wait(2000)
    .evaluate(() => {
      var friendsList = document.querySelectorAll('.elementList > div.friendInfo')
      var friends = []
      for (var i = 0; i < friendsList.length; i++) {
        var friend = {}
        for (var j = 0; j < friendsList[i].childNodes.length; j++) {
          if (friendsList[i].childNodes[j].tagName === 'A') {
            var link = friendsList[i].childNodes[j]
            if (link.classList[0] === 'userLink') {
              friend.name = link.textContent
              friend.id = link.href.split('/')[5]
            } else if (link.href && link.href.substring(1, 7) === 'review') {
              friend.bookCount = parseInt(link.textContent)
            }
          }
        }
        friends.push(friend)
      }
      return friends
    })
    .then(friends => {
      console.log('f', friends)
      callback(null, friends)
    })

}

function isBookLink (link) {
  return link.href && link.href.substring(1, 6) === 'review'
}

function scrapeFriends () {
  var friendsList = document.querySelectorAll('.elementList > div.friendInfo')
  var friends = []
  for (var i = 0; i < friendsList.length; i++) {
    var friend = {}
    for (var j = 0; j < friendsList[i].childNodes.length; j++) {
      if (friendsList[i].childNodes[j].tagName === 'A') {
        var link = friendsList[i].childNodes[j]
        if (link.classList[0] === 'userLink') {
          friend.name = link.textContent
          friend.id = link.href.split('/')[4]
        } else if (isBookLink()) {
          friend.bookCount = parseInt(link.textContent)
        }
      }
    }
    friends.push(friend)
  }
  return friends
}


