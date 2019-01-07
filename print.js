const dateFormat = require('dateformat')
const parseDate = require('parse-date')
const tty = require('tty')

// Fields
const TITLE = 'Title'
const LISTENED = 'Listened'
const PURCHASED = 'Purchased'
const PRICE = 'Price'
const SUGGESTED_PRICE = 'Sugg.'
const STORE = 'Store'
const OTHER = 'Other'
const columns = [
    { name: TITLE, width: 30 },
    { name: LISTENED, width: 16 },
    { name: PURCHASED, width: 10 },
    { name: PRICE, width: 7 },
    { name: SUGGESTED_PRICE, width: 5 },
    { name: STORE, width: 10 },
    { name: OTHER, width: 20 }
]

function getRequiredConsoleWidth() {
    var requiredConsoleWidth = 0
    columns.forEach(c => {
        requiredConsoleWidth += (c.width + 3)
    });
    return requiredConsoleWidth + 1
}
const requiredConsoleWidth = getRequiredConsoleWidth()

// TODO Better abstraction of output stream. So far we rely on
// 'self' object, which is the vorpal object. 

exports.printItems = function (long, items) {
    if (long) {
        printItemsDetailed(items)
    } else {
        printItems(items)
    }
}

function printItems(items) {
    items.map(i => self.log(i.title))
}

function printItemsDetailed(items) {
    if(requiredConsoleWidth > process.stdout.columns){
        self.log(`Window width must be at least ${requiredConsoleWidth} to print detailed info.`)
    } else {
        self.log('TODO Detailed list of items')
        printHeadingRow()
        items.map(i => printItem(i))
    }
}


// 2018-11-01 (+1)

function printHeadingRow() {
    // TODO We can print detailed information only if width of the console
    // exceeds certain level.
    // TODO Add fields:
    // Title, Listened (newest + n), Purchased, Price, Suggested price, Store, Other
    var headingTop = '┌'
    columns.map((c, i) => {
        headingTop += ''.padEnd(c.width + 2, '─')
        if(i < columns.length - 1){
            headingTop += '┬'
        } else {
            headingTop += '┐'
        }
    })
    var fieldsRow = '|'
    columns.map((c, i) => {
        fieldsRow += (' ' + c.name + ' ').padEnd(c.width + 2) + '|'
    })
    var headingBottom = '├'
    columns.map((c, i) => {
        headingBottom += ''.padEnd(c.width + 2, '─')
        if(i < columns.length - 1){
            headingBottom += '┼'
        } else {
            headingBottom += '┤'
        }
    })

    //self.log('Row length: ' + headingTop.length)
    self.log(headingTop)
    self.log(fieldsRow)
    self.log(headingBottom)
}

function printItem(item) {
    self.log('  ' + item.title)
}
