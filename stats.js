const parseDate = require('parse-date')
const _ = require('lodash')

// Rough overall estimates for used currencies - we should get rate by date if
// we want to be exact, but these will do atm.
const currencyRates = {
    'EUR': 1,
    'GBP': 1.5,
    'USD': 0.8,
    'FIM': 0.17
}

// TODO Filter stats by artist, release date, store etc...
exports.stats = function (year, releases) {
    purchases(year, releases)
    listens(year, releases)
}

listens = function (year, releases) {

    listenedItems = releases
        .filter(r => r.notes.listened && r.notes.listened.includes(year))
        //.filter(r => r.year == year)
        .map(r => {
            listened = parseListened(r.notes.listened)
            return {
                'partial': listened.partial,
                'whole': listened.whole,
                'heading': `${r.artist.name}: ${r.title}`
            }
        })

    listenedItems = _.orderBy(listenedItems,
        ['whole', 'partial', 'heading'],
        ['desc', 'desc', 'asc'])

    self.log(`Listened to ${_.uniqBy(listenedItems, 'heading').length} different items`)
    var whole = 0
    var partial = 0
    listenedItems.forEach(l => {
        whole += l.whole
        partial += l.partial
    })
    self.log(`Whole album listens ${whole} times, partial listens ${partial} times.`)
    self.log('Most listened items:')
    
    listenedItems.slice(0,19).forEach(i => {
        if(i.partial == 0){
            self.log(`${i.heading}: ${i.whole} whole listens.`)
        } else if(i.whole == 0){
            self.log(`${i.heading}: ${i.partial} partial listens.`)
        } else {
            self.log(`${i.heading}: ${i.whole} whole listens, ${i.partial} partial listens.`)
        }
    })

}

parseListened = function(item) {
    //console.log('Parse: ' + JSON.stringify(item))

    // Read chars until length or '(' or ','
    buffer = ''
    whole = []
    partial = 0
    lastRead = ''

    for(var i=0; i<item.length; i++){
        buffer += item[i]
        lastRead += item[i]
        if(item[i] == ',' || i == item.length-1){
            whole.push(lastRead)
            lastRead = ''
        }
        if(item[i] == '('){
            while(item[i++] != ')'){}
            if(i < item.length && item[i] == ','){
                i++
            }

            // TODO Parse plays of each side separately 
            partial++
        }
    }
    return {
        'partial': partial,
        'whole': whole.length,
    }

}

exports.testParseListened = function(item) {

    // Listened are in forms of whole or partial listens, for example:
    // 2018-11-12
    // 2018-11-12, 2018-11-13
    // 2018-11-12 (A, B)
    // 2018-11-12 (A, B), 2018-11-13
    // 2018-11-12 (A, B), 2018-11-13 (B, C)
    // 2018-11-12 (A, B), 2018-11-13 (B, C), 2018-11-14

    examples = [
        '2018-11-12',               // 1 whole
        '2018-11-12, 2018-11-13',   // 2 whole
        '2018-11-12 (A, B)',        // 1 partial
        '2018-11-12, 2018-11-13 (A, B)',    // 1 whole, 1 partial
        '2018-11-12 (A, B), 2018-11-13',    // 1 whole, 1 partial
        '2018-11-12 (A, B), 2018-11-13 (B, C)', // 2 partial
        '2018-11-12 (A, B), 2018-11-13 (B, C), 2018-11-14'  // 1 whole, 2 partial
    ]

    examples.forEach(example => parseListened(example))

}

purchases = function (year, releases) {

    var purchases = []
    var purchasesAmount = 0
    releases.forEach(item => {

        if (item.notes.date && parseDate(item.notes.date).getFullYear() == parseInt(year)) {
            purchases.push(item)
            if (item.notes.price) {
                price = item.notes.price.replace('~', '').split(' ')
                if (price.length == 2) {
                    priceValue = currencyRates[price[1]] * price[0]
                } else {
                    priceValue = price[0]
                }
                purchasesAmount += parseFloat(priceValue)
            }
        }
    })

    self.log('Purchased ' + purchases.length + ' items at ' + year)
    self.log('Total sum ' + parseFloat(purchasesAmount).toFixed(2) + ' €')

    // TODO Show each item only if specified
    purchases = _.sortBy(purchases, function(item){return item.artist.name})
    purchases.forEach(item =>
        self.log(item.artist.name + ': ' + item.title + ', price: ' + item.notes.price)
    )
}