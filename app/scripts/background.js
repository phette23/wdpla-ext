/* global $ */
/*
 * background.js:
 * listen for messages from contentscript.js
 * messages contain wp object with info about article
 * construct DPLA API queries using that info
 * when we have results, send subset of DPLA metadata to contentscript.js
 */

'use strict';

// construct a query URI
// @todo query global var is a bad idea, rethink this
// e.g. consider multiple tabs searching DPLA at once, crossed streams
var query = '',
buildURI = function (query) {
    var base = 'http://api.dp.la/v2/items',
        key = 'e4c036f3302aad8d8c188683967b9619';

    return base + '?api_key=' + key + '&q=' + encodeURIComponent(query);
},
// truncate string if too long & add …
trunc = function (str, int) {
    // default to 60 char cutoff
    var cutoff = parseInt(int, 10) || 60,
        // lots of Hathi Trust titles end in ' /'
        newStr = str.replace(/(\s\/)$/, '');

    if (newStr.length > cutoff) {
        // trim trailing whitespace of substring
        return newStr.substr(0, cutoff).replace(/\s$/,'') + '&hellip;';
    } else {
        return newStr;
    }
},
// given DPLA doc, see if its type array contains 'image'
isItAnImage = function (types) {
    // types can be array or string
    if ($.isArray(types)) {
        for (var type in types) {
            if (type.toLowerCase() === 'image') {
                return true;
            }
        }
        return false;
    } else if (types && types.toLowerCase() === 'image') {
        return true;
    } else {
        return false;
    }
},
// map DPLA metadata into simpler subset
dplaMap = function (item) {
    var newItem = {}
        , res = item.sourceResource;

    newItem.title = Array.isArray(res.title) ? res.title[0] : res.title;
    newItem.title = trunc(newItem.title);
    newItem.uri = item.isShownAt;
    newItem.isImage = isItAnImage(res.type);

    return newItem;
},
// perform the map above
subsetDpla = function (dpla) {
    return dpla.docs.map(dplaMap);
},
// send XHR to DPLA, pass results to callback
getDplaResults = function (wp, cb) {
    var url = buildURI(query);

    $.ajax({
        url: url,
        dataType: 'json'
    })
    .done(function(data) {
        var results = subsetDpla(data);

        // if we didn't get anything, try a fallback
        if (results.length === 0) {
            // first look in redirects
            if (wp.redirects.length !== 0) {
                query = wp.redirects.pop();
                // out of redirects? look in categories
            } else if (wp.categories.length !== 0) {
                query = wp.categories.pop();
            } else {
                // @todo handle this situation
                console.log('Not a single DPLA search result…damn.');
            }

            // will use the new query
            getDplaResults(wp, cb);
            return;
        }

        cb(results);
    })
    .fail(function(data, status, xhr) {
        console.log('XHR error. Status:', status, 'XHR:', xhr);
    });
};

chrome.runtime.onMessage.addListener(function (request, sender) {
    // contentscript sends wp object with info about article
    var wp = request,
        id = sender.tab.id;

    query = wp.title;

    console.log('Message from a content script at', sender.tab.url);

    getDplaResults(wp, function (suggestions) {
        // a callback 3rd param to addListener never seems to work
        // but using this manual callback method does
        chrome.tabs.sendMessage(id, suggestions);
    });
});
