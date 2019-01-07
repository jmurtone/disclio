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
