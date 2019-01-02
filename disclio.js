
const vorpal = require('vorpal')()
const tty = require('tty')
const parse = require('./parse.js')
const download = require('./download.js')
const foo = require('./foo')
const fs = require('fs')
const Discogs = require('disconnect').Client
const store = require('./store')
const stats = require('./stats')

const _ = require('lodash')

const DATA_DIR = 'data'
const COLLECTION_DIR = 'data/collection'

const USER_FILE = 'data/user.json'
const FOLDERS_FILE = 'data/collection/folders.json'

var dis = null
var user = null
var folders = null
var rootFolder = { name: '/' }
var folderNames = []
var parentFolders = []
var currentFolder = rootFolder

// try to read local storage i.e. disclio json files
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR)
}
if (!fs.existsSync(COLLECTION_DIR)) {
  fs.mkdirSync(COLLECTION_DIR)
}

try {
  user = JSON.parse(fs.readFileSync(USER_FILE))
} catch (err) {
}

try {
  folders = JSON.parse(fs.readFileSync(FOLDERS_FILE))
  folderNames = folders.map(f => f.name.toLowerCase())
} catch (err) {
}

vorpal
  .command('pwd', 'Print current folder or artist')
  .action(function (args, callback) {
    this.log(currentFolder.name)
    //this.log(JSON.stringify(currentFolder))
    callback()
  })

vorpal
  .command('cd <folder>', 'Go to folder')
  .autocomplete(folderNames)
  .action(function (args, callback) {
    if (args.folder == '..') {
      if (currentFolder != rootFolder) {
        currentFolder = parentFolders.pop()
      }
    } else {
      if (!folders) {
        this.log('Please download collection first.')
      }
      folder = folders.find(f => f.name.toLowerCase() == args.folder.toLowerCase())
      if (!folder) {
        this.log('Cannot go to \'' + args.folder + '\'')
      }
      if (folder && !folder.releases) {
        folder.releases = JSON.parse(fs.readFileSync(COLLECTION_DIR + '/' + args.folder + '.json'))
      }
      if (folder && folder.releases) {
        parentFolders.push(currentFolder)
        currentFolder = folder
      }
    }
    callback()
  })

vorpal
  .command('initUser', 'Confirms whether to continue with stored user')
  .hidden()
  .action(function (args, callback) {

    var self = this
    return this.prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'User ' + user.username + ' found. Continue as ' + user.username + '?'
    }, function (result) {
      if (result.confirm) {
        dis = new Discogs({ userToken: user.token });
        self.log('Ok.')
      } else {
        self.log('Set another user by typing: user <username>')
      }
    })
    callback()
  })

vorpal
  .command('list [filter]', 'List items (at root level lists folders). ' + 
           'Optional filter for refining lists by name (supports wildcards)')
  .alias('ls')
  .action(function (args, callback) {

    if (!folders) {
      this.log('Please download collection first.')
    } else {
      if (currentFolder == rootFolder) {
        folders.map(f => this.log(f.name + ': ' + f.count + ' items.'))
      } else {

        // TODO Try to read artists (and their releases) straight from folder structure.
        // If they don't exist, create structure and assign it to folder.

        artists = []
        currentFolder.releases.forEach(r => {

          // TODO Apply filter
          artist = _.find(artists, { 'artist': r.artist.name })
          if (!artist) {
            artist = { 'artist': r.artist.name, 'releases': [] }
            artists.push(artist)
          }
          artist.releases.push(r)
        })
        var sortedArtists = _.sortBy(artists, 'artist')

        const MAX_ARTIST_LENGTH = 29
        var terminalWidth = process.stdout.columns

        var columns = Math.floor(terminalWidth / (MAX_ARTIST_LENGTH + 1))
        var rowCount = Math.ceil(artists.length / columns)

        for(var i=0; i<rowCount; i++){
          rowStr = ''
          for(var j=0; j<columns && i + (j*rowCount) < sortedArtists.length; j++){
            artist = sortedArtists[i + (j*rowCount)].artist
            rowStr += artist.substring(0,29).padEnd(30)
          }
          this.log(rowStr)
        }
      }
    }
    callback()
  })

/* TODO Implement resizing of lists
console.log('screen size has changed!');
process.stdout.on('resize', () => {
  console.log(`${process.stdout.columns}x${process.stdout.rows}`);
});*/

vorpal
  .command('stats [year]', 'Show statistics for a year')
  .action(function (args, callback) {

    var folder = currentFolder

    if (folder == rootFolder) {
      folder = folders.find(f => f.name == 'All')
      if (!folder) {
        this.log('Error: No folder \'All\'')
      } else if (!folder.releases) {
        folder.releases = JSON.parse(fs.readFileSync(COLLECTION_DIR + '/All.json'))
      }
    }

    if (!folder || !folder.releases) {
      this.log('Error: No releases in folder ' + folder.name)
    }

    self = this
    var year = args.year || new Date().getFullYear()
    stats.stats(year, folder.releases)
    callback()

  })

vorpal
  .command('download', 'Download collection')
  .action(function (args, callback) {
    if (!user.username) {
      this.log('Please set user first.')
    }
    self = this
    download.download(dis, user.username).then(function (data) {
      folders = data.folders.map(f => ({
        'id': f.id,
        'name': f.name,
        'count': f.count
      }))
      fs.writeFileSync(FOLDERS_FILE, JSON.stringify(folders))
      folderNames = folders.map(f => f.name.toLowerCase())
      self.log('Folders: ' + JSON.stringify(folders))

      folders.forEach(f => {
        download.downloadFolder(dis, user.username, f, COLLECTION_DIR, folders)
      })
    }
    )
    callback()
  })

vorpal
  .command('user [username]', 'Set user for requests or print user info')
  .action(function (args, callback) {

    if (!args.username) {
      if (!user) {
        this.log('No user set. See \'help user\'')
      } else {
        this.log('User:\t' + user.username + '\nToken:\t' + user.token)
      }
    } else {

      user = {
        "username": args.username
      }
      const self = this // What does this do?
      return this.prompt([{
        type: 'input',
        name: 'token',
        message: 'Token: '
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Store user credentials in local storage (plain text)?'
      }
      ], function (result) {
        user.token = result.token
        dis = new Discogs({ userToken: result.token });
        if (result.confirm) {
          try {
            fs.writeFileSync(USER_FILE, JSON.stringify(user))
            self.log('Wrote user info in local storage')
          } catch (err) {
            self.log(err)
          }
        }
      })
    }
    callback()
  });

vorpal
  .delimiter('disclio$')
  .show();

vorpal.log('\n+-------------------------+');
vorpal.log('|  Disclio - Discogs CLI  |');
vorpal.log('+--------------------------');
if (user) {
  vorpal.exec('initUser')
} else {
  //vorpal.log('Generate your token in Discogs to request your collection info:  (https://www.discogs.com/settings/developers)')
  vorpal.log('Start by typing: user [username] (or help to see other available commands)\n')
}

vorpal
  .delimiter('disclio$')
  .show();
