/* global jQuery */
/* jQuery is available since it's loaded as another content script
 * using v. 1.8.3 since that's what Wikipedia uses, helps with consistency
 * @todo revisit jQuery dependency, probably not necessary
 *
 * contentscript.js:
 * parse the article's HTML into wp object
 * send {wp} to background.js
 * on response from background.js, insert results into DOM
 */

'use strict';

var $ = jQuery,
wp = {
    title: $('#firstHeading').text(),
    redirects: [],
    categories: [],
    // find any '"Foo" redirects here.' alternate titles
    getRedirects: function () {
        $('.hatnote').each(function (index, el){
            var test = $(el).text().match('"(.*)" redirects here.');

            if (test) {
                wp.redirects.push(test[1]);
            }
        });
    },
    // find the categories on the page
    getCategories: function () {
        $('#mw-normal-catlinks li').each(function (index, el){
            // this == current DOM el, not wp
            wp.categories.push($(el).text());
        });
    }
},
// background.js will populate this from the DPLA API
suggestions = [],
// on off-chance title contains unescaped HTML,
// replace any angle brackets < > with HTML entities
rmAngles = function (str) {
    return str.replace('<','&lt;').replace('>','&gt;');
},
// put constructed HTML into DOM
addToDOM = function (html) {
    // #mw-content-text is main body of article
    $('#mw-content-text').prepend(html);
    // @todo is this the smoothest way to do this?
    $('#loaddpla').hide('slow');
    $('#wikipedpla').show('slow');
},
// add HTML to page based on info in suggestions array
displaySuggestions = function () {
    // @todo is there a better way to construct this HTML?
    var html = '<div id="wikipedpla" class="hatnote"><a href="http://dp.la">' +
        chrome.i18n.getMessage('apiName') + '</a> ',
        len = suggestions.length;

    // if we don't have suggestions yet,
    // wait for background.js to send them to us
    if (len === 0) {
        console.log('No suggestions available yet…');
        setTimeout(displaySuggestions, 300);
        return;
    }

    // handling plurals
    if (len === 1) {
        html += chrome.i18n.getMessage('item') + ':';
    } else {
        html += chrome.i18n.getMessage('items') + ':';
    }

    $.each(suggestions, function (index, item) {
        var last = (index + 1 === len);

        // len !== 1 prevents "&" added to a list of 1
        if (last && len !== 1) {
            html += ' & ';
        }

        html += ' <a href="' + rmAngles(item.uri) + '"';

        if (item.isImage) {
            html += ' class="dp-img"';
        }

        html += '>' + rmAngles(item.title);

        if (!last) {
            html += '</a>,';
        } else {
            html += '</a>.';
        }
    });

    html += '</div>';

    addToDOM(html);
},
// add #loaddpla link & ask background.js for data
init = function() {
    // only execute on the Main (Articles) namespace
    // the first tab, text "Articles", has an id
    // of form "cs-nstab-$NAMESPACE"
    var tab = $('li[id^="ca-nstab-"]');

    if (tab.attr('id').substr(-4) === 'main' &&
        tab.hasClass('selected') &&
        $('#ca-view').hasClass('selected') &&
        tab.text() !== 'Main Page') {
        // collect page information
        wp.getRedirects();
        wp.getCategories();

        // add the #loaddpla link
        $('#mw-content-text').prepend('<div class="hatnote"><a id="loaddpla">' +
            chrome.i18n.getMessage('searchTheApi') + '…</a></div>')
            .find('#loaddpla').show('slow');
        $('#loaddpla').on('click', displaySuggestions);

        chrome.runtime.sendMessage(wp);

        chrome.runtime.onMessage.addListener(function (req) {
            suggestions = req;
            console.log('Suggestions:', suggestions);
        });
    }
};

init();
