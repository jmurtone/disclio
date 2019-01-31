const fs = require('fs')
const dateFormat = require('dateformat')
const parseDate = require('parse-date')
const parse = require('./parse')


const PAGE_SIZE = 100

exports.download = function(dis, user) {

  self.log('Request collection folders for user ' + user)
  return dis.user().collection().getFolders(user)

}

exports.downloadFolder = function(dis, user, folder, dir, folders) {

  self.log('Download items for folder: ' + JSON.stringify(folder.name))
  var pageCount = Math.ceil(folder.count / PAGE_SIZE)
  //self.log(folder.count + ' releases in folder => ' + pageCount + ' pages, each of ' + PAGE_SIZE + ' items.')

  var results = []
  if(folder.count == 0){
    folder.fetched = true
  }
  for(var i = 1; i <= pageCount; i++){
    //self.log('Downloading page ' + i)
    dis.user().collection().getReleases(user, folder.id, {'page': i, 'per_page': PAGE_SIZE}, function(err, data){
        results.push(data.releases.map(r => {
          var notes = r.notes ? parse.parseNotes(r.basic_information.title, r.notes) : null
          var listened = null
          try {
            listened = notes && notes.listened ? parse.parseListened(notes.listened) : null
          } catch(e) {
            self.log('Error parsing listened field in item: ' + r.basic_information.title)
          }
          return {
          'id': r.basic_information.id,
          'year': r.basic_information.year,
          'master_id': r.basic_information.master_id,
          'instance_id': r.instance_id,
          'artist': {
            'id': r.basic_information.artists[0].id,
            'name': r.basic_information.artists[0].name
          },
          'title': r.basic_information.title,
          'notes': notes,
          'listened': listened
        }}))
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
