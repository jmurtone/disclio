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

    // TODO: Shows count of all listens, not only selected year. Please fix.
    self.log('BUG: Shows count of all listens, not only selected year. Please fix.')
    listenedItems = releases
        .filter(r => r.notes.listened && r.notes.listened.includes(year))
        .map(r => {
            listened = parseListened(r.notes.listened, year)
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

parseListenedOrig = function(item, year) {
    console.log('\nParse: ' + JSON.stringify(item))

    // Read chars until length or '(' or ','
    buffer = ''
    whole = []
    partial = []

    for(var i=0; i<item.length; i++){
        
        var char = item[i]
        buffer += item[i]
        if(char == ','){
            // TDOO Check year before pushing to array
            whole.push(buffer.substring(0, buffer.length-1).trim())
            buffer = ''

            console.log('Whole: '+ whole[whole.length-1])

        } else if(i == item.length-1) {
            // TDOO Check year before pushing to array
            whole.push(buffer.trim())
            buffer = ''

            console.log('Whole: '+ whole[whole.length-1])

        } else if(item[i] == '('){
            // TDOO Check year before pushing to array
            partial.push(buffer.substring(0, buffer.length-1).trim())
            buffer = ''

            console.log('Partial: ' + partial[partial.length-1])

            while(item[i++] != ')'){
            }
            if(i < item.length && item[i] == ','){
                i++
            }
        }
    }
    return {
        'partial': partial.length,
        'whole': whole.length,
    }

}

// TODO Refactor so that we have yearly stats of both whole and partial listens  
parseListened = function(item, year) {

    console.log('\nParse: ' + JSON.stringify(item))

    buffer = ''
    whole = []
    partial = []

    // Read chars until length or '(' or ','
    for(var i=0; i<item.length; i++){
        
        var char = item[i]
        //buffer += item[i]

        // At the end of string
        if(i == item.length-1){
            // TDOO Check year before pushing to array
            console.log('Whole: '+ buffer + char)
            whole.push(buffer + char)
        }

        if(item[i] == ','){
            // TDOO Check year before pushing to array
            console.log('Whole: '+ buffer.trim())
            whole.push(buffer.trim())
            buffer = ''

        } else if(item[i] == '('){
            // TDOO Check year before pushing to array
            partial.push(buffer.substring(0, buffer.length-1).trim())
            buffer = ''

            console.log('Partial: ' + partial[partial.length-1])

            while(item[i++] != ')'){
            }
            if(i < item.length && item[i] == ','){
                i++
            }
        }
    }
    return {
        'partial': partial.length,
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

    examples.forEach(example => parseListened(example, '2008'))

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