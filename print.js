const dateFormat = require('dateformat')
const parseDate = require('parse-date')

// TODO Better abstraction of output stream. So far we rely on
// 'self' object, which is the vorpal object. 

exports.printItems = function (long, items){
    if(long) {
        printItemsDetailed(items)
    } else {
        printItems(items)
    }
}

function printItems(items) {
    items.map(i => self.log(i.title))
}

function printItemsDetailed(items) {
    self.log('TODO Detailed list of items')
    printHeadingRow()
    items.map(i => printItem(i))
}

function printHeadingRow() {
    // TODO We can print detailed information only if width of the console
    // exceeds certain level.
    // TODO Add fields
    self.log('Title\n-----')
}

function printItem(item) {
    self.log(item.title)
}
