const pull = require('pull-stream')
const vorpal = require('vorpal')()

//
const fetchEndorsements = require('./amazon')
const test1 = '0882142216'
const test2 = '158394835X'
pull(
  fetchEndorsements(test1),
  pull.map(authorRegx),
  pull.map(r => {
    console.log('fetched', r)
    return r
  }),
  pull.flatten(),
  pull.map(cleanText),
  pull.filter(bio => bio.includes('author')),
  pull.map(textToObject),
  pull.drain(endorsements => {
    console.log(endorsements)
  })
)

function separator (bio) {
  if (bio.includes('authors of')) {
    return ' authors of '
  } else if (bio.includes(' author of ')) {
    return ' author of '
  } else if (bio.includes('author')) {
    return ' author '                      
  }
}

function textToObject (bio) {
  const bioParts = bio.split(separator(bio))
  return { author: bioParts[0], bookTitle: bioParts[1] }
}

function cleanText (text) {
  return text.replace(/[\\,”“—-]|(<i>|<br|<\/i)/g, '')
}



function authorRegx (text) {
  text.trim()
  return text.match(/(>-|>—|"-|”—|"—|”-)(.*?)(<\/i|<br)/g)
}
