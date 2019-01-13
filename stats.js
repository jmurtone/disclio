const parseDate = require('parse-date')
const parse = require('./parse')
const _ = require('lodash')

// Rough overall estimates for used currencies - we should get rate by date if
// we want to be exact, but these will do atm.
const currencyRates = {
    'EUR': 1,
    'GBP': 1.5,
    'USD': 0.8,
    'FIM': 0.17
}

exports.purchases = function(releases, year, options){
    console.log('Purchases: ' + year, ', ' + JSON.stringify(options))
    return purchases(year, releases)
}

// TODO Filter stats by artist, release date, store etc...
exports.stats = function (year, releases) {
    purchases(year, releases)
    listens(year, releases)
}

listens = function (year, releases) {

    listenedItems = releases
        .filter(r => r.notes && r.notes.listened && r.notes.listened.includes(year))
        .map(r => {
            listened = parse.parseListened(r.notes.listened, year)

            return {
                'partial': listened.partial[year] ? listened.partial[year].length : 0,
                'whole': listened.whole[year] ? listened.whole[year].length : 0,
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

purchases = function (year, releases) {

    var purchases = []
    var purchasesAmount = 0
    releases.forEach(item => {

        if (item.notes && item.notes.date &&
            parseDate(item.notes.date).getFullYear() == parseInt(year)) {
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

    /* TODO Show each item only if specified
    purchases = _.sortBy(purchases, function(item){return item.artist.name})
    purchases.forEach(item =>
        self.log(item.artist.name + ': ' + item.title + ', price: ' + item.notes.price)
    )*/

    return purchases

}