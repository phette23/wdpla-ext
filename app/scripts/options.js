/*jshint -W004 */
let d = document
    , loadstyle = d.getElementById('loadstyle')
    , numresults = d.getElementById('numresults')
    // see https://developer.chrome.com/extensions/storage
    , storage = chrome.storage.sync;

// put message in notices area of DOM
function msg (style, txt, time=2500) {
    let p = d.createElement('p'),
        // div for informational items
        notices = d.getElementsByClassName('notices')[0];

    p.textContent = txt
    p.className = style += ' col-sm-offset-3'
    notices.appendChild(p)

    // remove the notice in 2.5s
    setTimeout(function(){
        notices.removeChild(p)
    }, time)
}

function storageSet () {
    msg('bg-success', chrome.i18n.getMessage('optsSuccessfulUpdate'))
}

function onLoadstyleChange (ev) {
    storage.set({ 'loadstyle': ev.target.value}, storageSet)
}

// used in onNumresultsChange to force an appropriate value
function validNum (num, mn, mx) {
    // input values are text by default, parse into integer
    let int = parseInt(num, 10),
        min = parseInt(mn, 10),
        max = parseInt(mx, 10);

    // most likely case is too big so check that 1st
    if (int > max || int < min) return false

    return true
}

function onNumresultsChange (ev) {
    let input = ev.target

    if (validNum(input.value, input.min, input.max)) {
        storage.set({'numresults': input.value}, storageSet)
    } else {
        msg('bg-warning', `${chrome.i18n.getMessage('optsNumresultsLabel')} ${chrome.i18n.getMessage('must_be_between')} ${input.min} ${chrome.i18n.getMessage('and')} ${input.max}`)
    }
}

// replace all placeholder English text on page with i18n text
function localize () {
    // set of CSS selector:textContent pairings
    let map = {
        'h1': 'optsTitle',
        'title': 'optsTitle',
        'label[for="loadstyle"]': 'optsLoadstyleLabel',
        '#loadstyle option[value="title"]': 'optsLoadTitle',
        '#loadstyle option[value="dablink"]': 'optsLoadDablink',
        '#loadstyle option[value="auto"]': 'optsLoadAuto',
        'label[for="numresults"]': 'optsNumresultsLabel'
    }

    Object.keys(map).forEach(function (key) {
        // see https://developer.chrome.com/extensions/i18n
        // also https://developer.chrome.com/webstore/i18n
        d.querySelector(key).textContent = chrome.i18n.getMessage(map[key])
    })
}

// replace placeholder form values with actual values from storage
function fillOptions () {
    // null => get all storage items
    storage.get(null, function (opts) {
        if (opts.loadstyle) loadstyle.value = opts.loadstyle
        if (opts.numresults) numresults.value = opts.numresults
    })
}

// eventListeners for page load
function listen () {
    // listen for changes then save them to storage
    loadstyle.addEventListener('change', onLoadstyleChange, false)
    numresults.addEventListener('change', onNumresultsChange, false)
}

// add event listeners, fill in stored options values
// replace text with localized strings
function init () {
    // replace text with localized strings
    localize()
    // fill in any already-selected options
    fillOptions()
    // eventListeners on form inputs
    listen()
}

// kick it off
d.addEventListener('DOMContentLoaded', init, false)
