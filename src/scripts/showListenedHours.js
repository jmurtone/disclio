fs = require('fs')

if (process.argv.length > 2) {
    timestamp = process.argv[2]
} else {
    timestamp = '1970-01-01'
}

timestamp = '1970-01-01'
inputFile = '../../data/collection/Vinyl.json'
suppress = false

// Rough estimated time of an album is about 46 mins. NOTE: we cannot know this, of course.
estimatedAveragePlayingTime = 46

if (process.argv.indexOf('-s')) {
    suppress = true
}

inputFileArgIndex = process.argv.indexOf('-i')
if (inputFileArgIndex > 0) {
    inputFile = process.argv[inputFileArgIndex + 1]
}

timestampArgIndex = process.argv.indexOf('-t')
if (timestampArgIndex > 0) {
    timestamp = process.argv[timestampArgIndex + 1]
}

avgTimeArgIndex = process.argv.indexOf('-e')
if (avgTimeArgIndex > 0) {
    estimatedAveragePlayingTime = parseInt(process.argv[avgTimeArgIndex + 1])
    console.log('Avg playing time: ' + estimatedAveragePlayingTime)
}

fs.readFile(inputFile, 'utf-8', function (err, data) {
    if (err) {
        console.log(err)
        console.log("Prior to running this script, download your collection by running disclio as instructed in main README.md.")
        console.log("Then pass that collection or folder file as argument to this script.")
        return
    }
    showListenedHoursSince(timestamp, JSON.parse(data))

})

function showListenedHoursSince(timestamp, data) {

    console.log('Show total listening time since ' + timestamp)

    listened = data.filter(item => !!item.notes.listened)
    listenedByDate = {}

    totalMins = 0
    listenedCount = 0
    listened.forEach(item => {
        listens = item.notes.listened.split(",")
        listens.forEach(l => {
            if (l.trim().match(/^\d/)) {
                listeningDate = Date.parse(l.trim().split(' ')[0])
                if (listeningDate >= Date.parse(timestamp)) {
                    if (l.indexOf('(') > 0) {
                        totalMins += (estimatedAveragePlayingTime / 2)
                    } else {
                        totalMins += estimatedAveragePlayingTime
                    }
                    listenedCount++

                    // Map by date, when an album has been listened, and how many times it has been listened on that day.
                    listeningDateStr = listeningDate.toString()
                    albumDisplayStr = item.artist.name + ': ' + item.title
                    if (Object.keys(listenedByDate).indexOf(listeningDateStr) > -1) {
                        if (Object.keys(listenedByDate[listeningDateStr]).indexOf(albumDisplayStr) > -1) {
                            listenedByDate[listeningDateStr][albumDisplayStr]++
                        } else {
                            listenedByDate[listeningDateStr][albumDisplayStr] = 1
                        }
                    } else {
                        listenedByDate[listeningDateStr] = {}
                        listenedByDate[listeningDateStr][albumDisplayStr] = 1

                    }

                }
            }
        })
    })

    console.log(`${listenedCount} listens since ${timestamp}, estimated listening time ${Math.floor(totalMins / 60)}h ${totalMins % 60} min total`)

    if (!suppress) {
        listenedByDateSorted = Object.keys(listenedByDate).sort()
        listenedByDateSorted.forEach(key => {
            console.log(new Date(parseInt(key)).toISOString().split('T')[0] + ':')
            Object.keys(listenedByDate[key]).forEach(album => {
                listenedTimes = listenedByDate[key][album]
                console.log('\t' + album + (listenedTimes > 1 ? ` (${listenedTimes}x)` : ''))
            })
        })
    }

}
