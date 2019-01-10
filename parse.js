const dateFormat = require('dateformat')
const parseDate = require('parse-date')

// Note: These may change in discogs, don't know if its unlikely or not.
const MEDIA_CONDITION_FIELD_ID = 1
const SLEEVE_CONDITION_FIELD_ID = 2
const NOTES_FIELD_ID = 3
const LISTENED_FIELD_ID = 5

exports.parseNotes = function(title, notes) {

  var debugTitles = [
    'Mob Rules',
    'Sacred Heart',
    'Ride The Lightning'
  ]
  var debug = false
  // debug = debugTitles.includes(title) ? true : false
  if(debug){
    self.log('Notes: ' + notes)
  }

  parsed = {}
  notes.forEach(note => {
    switch(note.field_id){
      case MEDIA_CONDITION_FIELD_ID: 
        parsed.mediaCondition = note.value
        return
      case SLEEVE_CONDITION_FIELD_ID:
        parsed.sleeveCondition = note.value
        return
      case NOTES_FIELD_ID:
        try {
          note.value.split(',').forEach(token => {
            field = token.split(':')
            key = field[0].trim()
            value = field[1].trim()
            if(key === 'date'){
              try {
                if(debug){
                  self.log('Date value: ' + value)
                }
                date = parseDate(value.replace('~', ''))
                if(debug){
                  self.log('Parsed date: ' + date)
                }
                parsed[key] = dateFormat(date, 'yyyy-mm-dd')
                if(debug){
                  self.log('Formatted date: ' + parsed[key])
                }
              } catch(err){
                self.log('Invalid date: ' + value.replace('~', '') + ' in title: ' + title)
              }
            } else {
              parsed[key] = value 
            }
          })
        } catch(err) {
            self.log("Invalid notes field in title " + title + ": " + note.value)
        }
        return
      case LISTENED_FIELD_ID:
        parsed.listened = note.value
        return
      default:
        return
    }
  })
  return parsed

}

exports.parseListened = function(notes) {

  var listened = notes.find(n => n.field_id == 5)
  if(listened){
    return parseListened(listened.value)
  }
  return null

}

parseListened = function(item) {
  // Read chars until length or '(' or ','
  buffer = ''
  whole = []
  partial = []

  for(var i=0; i<item.length; i++){
      
      var char = item[i]
      var date = null
      buffer += item[i]
      if(char == ','){
          whole.push(parseDate(buffer.substring(0, buffer.length-1).trim()))
          buffer = ''
      } else if(i == item.length-1) {
          whole.push(parseDate(buffer.trim()))
          buffer = ''
      } else if(item[i] == '('){
          partial.push(parseDate(buffer.substring(0, buffer.length-1).trim()))
          buffer = ''
          while(item[i++] != ')'){
          }
          if(i < item.length && item[i] == ','){
              i++
          }
      }
  }

  // TODO Convert to ES6 style maps
  var listened = {
    partial: parseAnnualListens(partial),
    whole: parseAnnualListens(whole)
  }
  //console.log('Parsed: ' + JSON.stringify(listened))
  return listened

}

function parseAnnualListens(listens){

  var annualListens = {}
  listens.forEach(l => {
    var year = l.getFullYear() //dateFormat(l, 'yyyy')
    if(!annualListens[year]){
      annualListens[year] = []
    }
    annualListens[year].push(dateFormat(l, 'yyyy-mm-dd'))
  })
  return annualListens
}

exports.testParseListened = function(item) {

  // Listened are in forms of whole or partial listens, for example:
  // 2018-11-12
  // 2018-11-12, 2018-11-13
  // 2018-11-12 (A, B)
  // 2018-11-12 (A, B), 2018-11-13
  // 2018-11-12 (A, B), 2018-11-13 (B, C)
  // 2018-11-12 (A, B), 2018-11-13 (B, C), 2018-11-14

  examples = [
      '2018-11-12',               // 1 whole
      '2018-11-12, 2018-11-13',   // 2 whole
      '2018-11-12 (A, B)',        // 1 partial
      '2018-11-12, 2018-11-13 (A, B)',    // 1 whole, 1 partial
      '2018-11-12 (A, B), 2018-11-13',    // 1 whole, 1 partial
      '2018-11-12 (A, B), 2018-11-13 (B, C)', // 2 partial
      '2018-11-12 (A, B), 2018-11-13 (B, C), 2018-11-14'  // 1 whole, 2 partial
  ]

  examples.forEach(example => exports.parseListened(example))

}
