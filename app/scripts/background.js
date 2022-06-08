/*
 * background.js:
 * listen for messages from contentscript.js
 * messages contain wp object with info about article
 * construct DPLA API queries using that info
 * when we have results, send subset of DPLA metadata & options to contentscript.js
 */

// construct a query URI
let buildURI = query => {
    let base = 'https://api.dp.la/v2/items',
        key = 'e4c036f3302aad8d8c188683967b9619';

    return base + '?api_key=' + key + '&q=' + encodeURIComponent(query)
},
// truncate string if too long & add …
trunc = (str, cutoff=60) => {
    // lots of Hathi Trust titles end in ' /'
    let newStr = str.replace(/(\s\/)$/, '')

    if (newStr.length > cutoff) {
        // trim trailing whitespace of substring
        return newStr.substr(0, cutoff).replace(/\s$/,'') + '&hellip;'
    }

    return newStr
},
// given DPLA doc, see if its type array contains 'image'
isItAnImage = types => {
    // types can be array or string
    if (Array.isArray(types) && types.includes('image')) {
        return true
    } else if (typeof types === 'string' && types.toLowerCase() === 'image') {
        return true
    }

    return false
},
// map DPLA metadata into simpler subset
dplaMap = item => {
    let newItem = {}
        , res = item.sourceResource;

    newItem.title = trunc(Array.isArray(res.title) ? res.title[0] : res.title)
    newItem.uri = item.isShownAt
    newItem.isImage = isItAnImage(res.type)

    return newItem
},
// perform the map above
subsetDpla = dpla => dpla.docs.map(dplaMap),
// get data from DPLA, pass results to callback
getDplaResults = (wp, cb) => {
    // get options from storage, will send to content script
    chrome.storage.sync.get({'numresults': 5, 'loadstyle': 'dablink'}, options => {
        fetch(buildURI(wp.query) + '&page_size=' + (options.numresults ? options.numresults : 5))
            .then(response => response.json())
            .then(data => {
                let resultsAndOptions = {
                    options: options,
                    results: {
                        query: wp.query,
                        list: subsetDpla(data)
                    }
                }
                console.log('DPLA response:', data)

                // if we didn't get anything, try a fallback
                if (resultsAndOptions.results.list.length === 0) {
                    // first look in redirects
                    if (wp.redirects.length !== 0) {
                        wp.query = wp.redirects.pop()
                        // out of redirects? look in categories
                    } else if (wp.categories.length !== 0) {
                        wp.query = wp.categories.pop()
                    } else {
                        // tell user to report the page on GitHub
                        return cb({
                            query: wp.title,
                            list: [{
                                'title': chrome.i18n.getMessage('noResults'),
                                'uri': 'https://chrome.google.com/webstore/detail/wikipedpla/jeblaajgenlcpcfhmgdhdeehjfbfhmml/reviews',
                                'isImage': false
                            }]
                        })
                    }

                    // will use the new query
                    return getDplaResults(wp, cb)
                }

                cb(resultsAndOptions)
            })
            .catch(err => console.error(err))
    })
};

chrome.runtime.onMessage.addListener((request, sender) => {
    // contentscript sends wp object with info about article
    let wp = request,
        id = sender.tab.id;

    console.log('Message from a content script at', sender.tab.url)
    console.log('{wp}:', wp)

    getDplaResults(wp, resultsAndOptions => {
        // a callback 3rd param to addListener never seems to work
        // but using this manual callback method does
        chrome.tabs.sendMessage(id, resultsAndOptions)
    })
})
