/*
 * background.js:
 * listen for messages from contentscript.js
 * messages contain wp object with info about article
 * construct DPLA API queries using that info
 * when we have results, send subset of DPLA metadata & options to contentscript.js
 */

// construct a query URI
let buildURI = function (query) {
    let base = 'http://api.dp.la/v2/items',
        key = 'e4c036f3302aad8d8c188683967b9619';

    return base + '?api_key=' + key + '&q=' + encodeURIComponent(query)
},
options,
// truncate string if too long & add …
trunc = function (str, cutoff=60) {
    // lots of Hathi Trust titles end in ' /'
    let newStr = str.replace(/(\s\/)$/, '')

    if (newStr.length > cutoff) {
        // trim trailing whitespace of substring
        return newStr.substr(0, cutoff).replace(/\s$/,'') + '&hellip;'
    }

    return newStr
},
// given DPLA doc, see if its type array contains 'image'
isItAnImage = function (types) {
    // types can be array or string
    if (Array.isArray(types) && types.includes('image')) {
        return true
    } else if (typeof types === 'string' && types.toLowerCase() === 'image') {
        return true
    }

    return false
},
// map DPLA metadata into simpler subset
dplaMap = function (item) {
    let newItem = {}
        , res = item.sourceResource;

    newItem.title = Array.isArray(res.title) ? res.title[0] : res.title
    newItem.title = trunc(newItem.title)
    newItem.uri = item.isShownAt
    newItem.isImage = isItAnImage(res.type)

    return newItem
},
// perform the map above
subsetDpla = function (dpla) {
    return dpla.docs.map(dplaMap)
},
// send XHR to DPLA, pass results to callback
// @TODO use fetch instead of XHR
getDplaResults = function (wp, cb) {
    let url = buildURI(wp.query),
        xhr = new XMLHttpRequest();

    // get options from storage, will send to content script
    chrome.storage.sync.get({'numresults': 5, 'loadstyle': 'dablink'}, function (opts) {
        options = opts
        // default to a limit of 5
        url += '&page_size=' + (options.numresults ? options.numresults : 5)

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                let data = JSON.parse(xhr.responseText),
                    results = {
                        query: wp.query,
                        list: subsetDpla(JSON.parse(xhr.responseText))
                    };

                console.log('DPLA response:', data)

                // if we didn't get anything, try a fallback
                if (results.list.length === 0) {
                    // first look in redirects
                    if (wp.redirects.length !== 0) {
                        wp.query = wp.redirects.pop()
                        // out of redirects? look in categories
                    } else if (wp.categories.length !== 0) {
                        wp.query = wp.categories.pop()
                    } else {
                        // send a fake "result" to be displayed
                        // which tells user to report the page
                        return cb({
                            query: null,
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

                cb(results)
            }
        }

        xhr.open('GET', url, true)
        xhr.send()
    })
};

chrome.runtime.onMessage.addListener(function (request, sender) {
    // contentscript sends wp object with info about article
    let wp = request,
        id = sender.tab.id;

    console.log('Message from a content script at', sender.tab.url)
    console.log('{wp}:', wp)

    getDplaResults(wp, function (results) {
        let data = { 'options': options, 'results': results }
        // a callback 3rd param to addListener never seems to work
        // but using this manual callback method does
        chrome.tabs.sendMessage(id, data)
    });
});
