

exports.download = function(user, dc) {
  self.log('Request collection folders for user ' + user)
  return dc.user().collection().getFolders(user)
}
