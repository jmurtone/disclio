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

const sortOptions = {
    'artist': 'artist.name',
    'date': 'notes.date',
    'store': 'notes.store',
    'price': 'notes.priceValue'
}

exports.purchases = function(releases, year, options){
    //console.log('Purchases: ' + year + ', options ' + JSON.stringify(options))
    var purchases = getPurchases(year, releases)
    if(options.sort){
        purchases.purchases = _.orderBy(purchases.purchases, sortOptions[options.sort])
    }

    var totalSum = purchases.sum
    var filtered = []
    if(options.artist){
        purchases.purchases = _.filter(purchases.purchases,
            i => i.artist.name.toLowerCase() == options.artist.toLowerCase())
    } else if(options.store){
        purchases.purchases = _.filter(purchases.purchases,
            i => i.notes.store.toLowerCase() == options.store.toLowerCase())
    } else if(options.min){
        // TODO
    } else if(options.max){
        // TODO
    }

    // To get the sum of filtered purchases 
    purchases = getPurchases(year, purchases.purchases)
    return Object.assign({}, purchases, {totalSum: totalSum})
}

// TODO Filter stats by artist, release date, store etc...
exports.stats = function (year, releases) {
    getPurchases(year, releases)
    getListens(year, releases)
}

getListens = function (year, releases) {

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

getPurchases = function (year, releases) {

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
                item.notes.priceValue = parseFloat(priceValue)
                purchasesAmount += parseFloat(priceValue)
            } else {
                item.notes.priceValue = parseFloat(0)
            }
        }
    })

    return {
        purchases: purchases,
        sum: purchasesAmount
    }

}