const store = require('./store')

exports.printFoo = function () {
    self.log('Message in store: ' + store.foofoo.message)
}

exports.setFoo = function (message) {
    store.foofoo.message = message
}

