const dateFormat = require('dateformat')
const parseDate = require('parse-date')
const tty = require('tty')

// Fields
const ARTIST = 'Artist'
const TITLE = 'Title'
const LISTENED = 'Listened'
const PURCHASED = 'Purchased'
const PRICE = 'Price'
const SUGGESTED_PRICE = 'Sugg.'
const STORE = 'Store'
const OTHER = 'Other'
const itemsColumns = [
    { name: TITLE, width: 30, field: 'title' },
    { name: LISTENED, width: 16, field: 'listened' },
    { name: PURCHASED, width: 10, notesField: 'date' },
    { name: PRICE, width: 7, notesField: 'price' },
    { name: SUGGESTED_PRICE, width: 5, notesField: 'suggestedPrice' },
    { name: STORE, width: 10, notesField: 'store' },
    { name: OTHER, width: 20, notesField: ['notes'] }
]

const purchasesColumns = [
    { name: ARTIST, width: 20, artistField: 'name'}
].concat(itemsColumns)

function getRequiredConsoleWidth(columns) {
    var requiredConsoleWidth = 0
    columns.forEach(c => {
        requiredConsoleWidth += (c.width + 3)
    });
    return requiredConsoleWidth + 1
}

// TODO Better abstraction of output stream. So far we rely on
// 'self' object, which is the vorpal object. 

exports.printItems = function (long, items) {
    if (long) {
        printItemsDetailed(items, itemsColumns)
    } else {
        printItems(items)
    }
}

exports.printPurchases = function (purchases) {
    // TODO Handling of verbose level
    printItemsDetailed(purchases, purchasesColumns)
}

function printItems(items) {
    items.map(i => self.log(i.title))
}

function printItemsDetailed(items, columns) {

    const requiredConsoleWidth = getRequiredConsoleWidth(columns)
    if (requiredConsoleWidth > process.stdout.columns) {
        self.log(`Window width must be at least ${requiredConsoleWidth} to print detailed info.`)
        items.map(i => self.log(i.title))
    } else {
        printHeadings(columns)
        items.map((item, i) => {
            printItem(item, columns)
            if (i < items.length - 1) {
                self.log(buildHorizontalBorder(columns, '├', '┼', '┤', '─'))
            }
        })
        self.log(buildHorizontalBorder(columns, '└', '┴', '┘', '─'))
    }
}


// 2018-11-01 (+1)

function printHeadings(columns) {

    //self.log('Row length: ' + headingTop.length)
    //self.log(buildHorizontalBorder('┌','┬','┐','─'))
    self.log(buildHorizontalBorder(columns, '╔', '╦', '╗', '═'))
    var fieldsRow = '║'
    columns.map((c, i) => {
        fieldsRow += (' ' + c.name + ' ').padEnd(c.width + 2) + '║'
    })
    self.log(fieldsRow)
    //self.log(buildHorizontalBorder('├','┼','┤','─'))
    self.log(buildHorizontalBorder(columns, '╚', '╩', '╝', '═'))
}

function buildHorizontalBorder(columns, left, mid, right, border) {

    var row = left
    columns.map((c, i) => {
        row += ''.padEnd(c.width + 2, border)
        if (i < columns.length - 1) {
            row += mid
        } else {
            row += right
        }
    })
    return row
}

function printItem(item, columns) {

    // TODO Print album title in multiple rows, if necessary, so we don't have to
    // cut it.

    var row = '|'
    columns.map((c, i) => {

        var fieldValue = ''
        if (c.field) {
            // TODO Better handling of special fields?
            if (c.name == LISTENED) {
                fieldValue = formatListened(item[c.field])
            } else {
                fieldValue = item[c.field]
            }

        } else if (c.notesField) {
            if(item.notes){
                fieldValue = item.notes[c.notesField] || ''
            }
        } else if (c.artistField) {
            if(item.artist){
                fieldValue = item.artist[c.artistField] || ''
            }
        }
        row += (' ' + (fieldValue || '')
            .substring(0, c.width) + ' ')
            .padEnd(c.width + 2) + '|'
    })
    self.log(row)
}

function formatListened(listened) {

    if(!listened)
        return null

    var latestListen = null
    var count = 0

    Object.keys(listened.partial).forEach(year => {
        var length = listened.partial[year].length
        count += length
        latestListen = listened.partial[year][length - 1]
    })

    Object.keys(listened.whole).forEach(year => {
        var length = listened.whole[year].length
        count += length
        latestListen = listened.whole[year][length - 1]
    })

    if (count == 0) {
        return ''
    }
    if (count == 1){
        return latestListen
    }
    return latestListen + ` (+ ${count - 1})`
}
