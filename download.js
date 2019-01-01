const fs = require('fs')
const dateFormat = require('dateformat')
const parseDate = require('parse-date')

const PAGE_SIZE = 100

const parseNotes = function(title, notes) {

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

exports.download = function(dis, user) {

  self.log('Request collection folders for user ' + user)
  return dis.user().collection().getFolders(user)

}

exports.downloadFolder = function(dis, user, folder, dir, folders) {

  self.log('Download items for folder: ' + JSON.stringify(folder.name))
  var pageCount = Math.ceil(folder.count / PAGE_SIZE)
  //self.log(folder.count + ' releases in folder => ' + pageCount + ' pages, each of ' + PAGE_SIZE + ' items.')

  var results = []
  for(var i = 1; i <= pageCount; i++){
    //self.log('Downloading page ' + i)
    dis.user().collection().getReleases(user, folder.id, {'page': i, 'per_page': PAGE_SIZE}, function(err, data){
        results.push(data.releases.map(r => ({
          'id': r.basic_information.id,
          'year': r.basic_information.year,
          'master_id': r.basic_information.master_id,
          'instance_id': r.instance_id,
          'artist': {
            'id': r.basic_information.artists[0].id,
            'name': r.basic_information.artists[0].name
          },
          'title': r.basic_information.title,
          'notes': r.notes ? parseNotes(r.basic_information.title, r.notes) : null
        })))
        if(results.length == pageCount){
          // flatten releases
          var releases = [].concat.apply([], results)
          self.log('Downloaded ' + releases.length + ' items for folder: ' + JSON.stringify(folder.name))
          fs.writeFileSync(dir + '/' + folder.name + '.json', JSON.stringify(releases))

          folder.releases = releases
          folder.fetched = dateFormat(new Date(), 'dd.MM.yyyy HH:mm:ss')
          //self.log('Folders: ' + JSON.stringify(folders))
        }

        if(!folders.some(f => !f.fetched)){
          self.log('All folders have been fetched.')
        }

    })
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
