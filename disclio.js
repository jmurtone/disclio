
const vorpal = require('vorpal')();
const parse = require('./parse.js')
const download = require('./download.js')
const fs = require('fs')
const Discogs = require('disconnect').Client

const DATA_DIR = 'data'
const USER_FILE = 'data/user.json'
const COLLECTION_FILE = 'data/collection.json'

var dis = {}
var folders = {}
var user = {}

// try to read local storage i.e. disclio json files
if (!fs.existsSync(DATA_DIR)){
  fs.mkdirSync(DATA_DIR)
}

try {
  user = JSON.parse(fs.readFileSync(USER_FILE))
} catch(err){
}

vorpal
.command('initUser', 'Confirms whether to continue with stored user')
.hidden()
.action(function(args, callback) {

  var self = this
  return this.prompt({
    type: 'confirm',
    name: 'confirm',
    message: 'User ' + user.username + ' found. Continue as ' + user.username + '?'
  }, function(result) {
    if(result.confirm){
      dis = new Discogs({userToken: user.token});
      self.log('Ok.')
    } else {
      self.log('Set another user by typing: user <username>')
    }
  })
  callback()
})

vorpal
.command('list', 'List items (at root level lists folders)')
.action(function(args, callback) {

  if(!folders){
    this.log('Please download collection first.')
  } else {
    folders.map(f => this.log(f.name))
  }
  callback()
})

vorpal
.command('download', 'Download collection')
.action(function(args, callback) {
  if(!user.username){
    this.log('Please set user first.')
  }
  self = this
  self.log('Downloading...')
  download.download(user.username, dis).then(function(data){
    folders = data.folders
    self.log('Downloaded collection.')
  }
)
callback()
})

vorpal
.command('user [username]', 'Set user for requests or print user info')
.action(function(args, callback) {

  if(!args.username) {
    if(!user.username){
      this.log('No user set. See \'help user\'')
    } else {
      this.log('User:\t' + user.username + '\nToken:\t' + user.token)
    }
  } else {

    user.username = args.username
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
  ], function(result){
    user.token = result.token
    dis = new Discogs({userToken: result.token});
    if(result.confirm){
      try {
        fs.writeFileSync(USER_FILE, JSON.stringify(user))
        self.log('Wrote user info in local storage')
      } catch(err){
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
if(user.username){
  vorpal.exec('initUser')
} else {
//vorpal.log('Generate your token in Discogs to request your collection info:  (https://www.discogs.com/settings/developers)')
  vorpal.log('Start by typing: user [username] (or help to see other available commands)\n')
}

vorpal
.delimiter('disclio$')
.show();
