const dateFormat = require('dateformat')
const parseDate = require('parse-date')

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
    // Note: Field ids are subject to change
    switch(note.field_id){
      case 1: 
        parsed.mediaCondition = note.value
        return
      case 2:
        parsed.sleeveCondition = note.value
        return
      case 3:
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
      case 5:
        // TODO Normalize to ISO date
        parsed.listened = note.value
        return
      default:
        return
    }
  })
  return parsed

}

exports.parseListened = function(item, year) {

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
  var listened = {
    partial: parseAnnualListens(partial),
    whole: parseAnnualListens(whole)
  }
  console.log('Parsed: ' + JSON.stringify(listened))
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

  examples.forEach(example => exports.parseListened(example, '2008'))

}
