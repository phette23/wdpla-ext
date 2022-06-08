/* jQuery is available since it's loaded as another content script
 * using v. 3.6.0 since that's what Wikipedia uses, helps with consistency
 *
 * contentscript.js:
 * parse the article's HTML into wp object
 * send {wp} to background.js
 * on response from background.js, insert results into DOM
 */

let $ = jQuery,
title = $('#firstHeading').text().trim(),
wp = {
    title: title,
    query: title, // query initially set to article title
    redirects: [],
    categories: [],
    // find any '"Foo" redirects here.' alternate titles
    getRedirects: () => {
        $('.hatnote').each((index, el) => {
            // @todo this assumes English
            let test = $(el).text().match('"(.*)" redirects here.');

            if (test) {
                wp.redirects.push(test[1]);
            }
        })
    },
    // find the categories on the page
    getCategories: () => {
        $('#mw-normal-catlinks li').each((index, el) => {
            // this == current DOM el, not wp
            wp.categories.push($(el).text())
        })
    }
},
// background.js will populate this from the DPLA API
results = [],
// on off-chance title contains unescaped HTML,
// replace any angle brackets < > with HTML entities
rmAngles = str => str.replace('<', '&lt;').replace('>', '&gt;'),
// put constructed HTML into DOM
addToDOM = html => {
    // #mw-content-text is main body of article
    $('#mw-content-text').prepend(html)
    $('#loaddpla').hide('slow')
    $('#wikipedpla').show('slow')
},
// add HTML to page based on info in results object
display = () => {
    // @todo is there a better way to construct this HTML?
    let html = `<div id="wikipedpla" class="hatnote"><a href="https://dp.la">${chrome.i18n.getMessage('apiName')}</a> `,
        len = results.list.length;

    // handling plurals
    if (len === 1) {
        html += chrome.i18n.getMessage('item')
    } else {
        html += chrome.i18n.getMessage('items')
    }

    // link to full DPLA search using query attribute of results object
    html += ` (<a class="external" href="https://dp.la/search?q=${encodeURIComponent(results.query)}">${chrome.i18n.getMessage('seeSearch')}</a>):`

    $.each(results.list, (index, item) => {
        let last = (index + 1 === len)

        // len !== 1 prevents "&" added to a list of 1
        if (last && len !== 1) {
            html += ' & '
        }

        html += ` <a href="${rmAngles(item.uri)}"`

        if (item.isImage) {
            html += ' class="dp-img"'
        }

        html += `>${rmAngles(item.title)}`

        if (!last) {
            // no comma in a list of two items
            if (len === 2) {
                html += '</a>'
            } else {
                html += '</a>,'
            }
        } else {
            html += '</a>.'
        }
    })

    html += '</div>'

    addToDOM(html)
},
// add #loaddpla link & ask background.js for data
init = () => {
    // only execute on the Main (Articles) namespace
    // the first tab, text "Articles", has an id
    // of form "cs-nstab-$NAMESPACE"
    let tab = $('li[id^="ca-nstab-"]')

    if (tab.attr('id').substr(-4) === 'main' &&
        tab.hasClass('selected') &&
        $('#ca-view').hasClass('selected') &&
        !location.pathname.match('^/wiki/Main_Page$')) {
        // collect page information
        wp.getRedirects()
        wp.getCategories()

        // send data to background script & wait for response
        chrome.runtime.sendMessage(wp)
        chrome.runtime.onMessage.addListener(response => {
            console.log(response)
            results = response.results

            if (response.options.loadstyle === 'dablink') {
                // add the #loaddpla link
                $('#mw-content-text')
                    .prepend(`<div class="hatnote">
                    <a id="loaddpla">${chrome.i18n.getMessage('searchTheApi')}…
                    </a></div>`)
                    .find('#loaddpla').show('slow')
                $('#loaddpla').on('click', display)
            } else if (response.options.loadstyle === 'title') {
                $('#firstHeading').css('cursor', 'pointer')
                    .on('click', display)
            } else if (response.options.loadstyle === 'auto') {
                display()
            }
        })
    }
};

init()
