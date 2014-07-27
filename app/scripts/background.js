/* global $ */
/*
 * background.js:
 * listen for messages from contentscript.js
 * messages contain wp object with info about article
 * construct DPLA API queries using that info
 * when we have some API results, sendResponse back to contentscript.js
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
buildSuggestions = function (dpla) {
    var items = dpla.docs,
        current = {},
        suggestions = [];

    // @todo should use Array.map here instead
    $.each(items, function (index, item){
        var res = item.sourceResource;

        current.title = $.isArray(res.title) ? res.title[0] : res.title;
        current.title = trunc(current.title);
        current.uri = item.isShownAt;
        current.isImage = isItAnImage(res.type);

        suggestions.push(current);
        current = {};
    });

    return suggestions;
},
// send XHR to DPLA, pass results to callback
getDPLAresults = function (wp, cb) {
    var url = buildURI(query);

    $.ajax({
        url: url,
        dataType: 'json'
    })
    .done(function(data) {
        var suggestions = buildSuggestions(data);

        // if we didn't get anything, try a fallback
        if (suggestions.length === 0) {
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
            getDPLAresults(wp, cb);
            return;
        }

        cb(suggestions);
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

    getDPLAresults(wp, function (suggestions) {
        // a callback 3rd param to addListener never seems to work
        // but using this manual callback method does
        chrome.tabs.sendMessage(id, suggestions);
    });
});
