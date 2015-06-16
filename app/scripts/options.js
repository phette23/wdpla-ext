/*jshint -W004 */
'use strict';

var d = document
    , loadstyle = d.getElementById('loadstyle')
    , numresults = d.getElementById('numresults')
    // see https://developer.chrome.com/extensions/storage
    , storage = chrome.storage.sync;

// put message in notices area of DOM
function msg (style, txt, time) {
    var p = d.createElement('p'),
        // div for informational items
        notices = d.getElementsByClassName('notices')[0],
        // 2.5s default delay time
        time = time !== undefined ? time : 2500;

    p.textContent = txt;
    p.className = style += ' col-sm-offset-3';

    // @todo should animate, this is terrible
    notices.appendChild(p);

    // remove the notice in 2.5s
    setTimeout(function(){
        notices.removeChild(p);
    }, time);
}

function storageSet () {
    msg('bg-success', chrome.i18n.getMessage('optsSuccessfulUpdate'));

    console.log('options updated');
}

function onLoadstyleChange (ev) {
    storage.set({ 'loadstyle': ev.target.value}, storageSet);
}

// used in onNumresultsChange to force an appropriate value
function validNum (num, min, max) {
    // input values are text by default, parse into integer
    var int = parseInt(num, 10),
        min = parseInt(min, 10),
        max = parseInt(max, 10);

    // most likely case is too big so check that 1st
    if (int > max || int < min) {
        return false;
    }

    return true;
}

function onNumresultsChange (ev) {
    var input = ev.target;

    if (validNum(input.value, input.min, input.max)) {
        storage.set({'numresults': input.value}, storageSet);
    } else {
        msg('bg-warning', chrome.i18n.getMessage('optsNumresultsLabel') + ' ' + chrome.i18n.getMessage('must_be_between') + ' ' + input.min + chrome.i18n.getMessage('and') + ' ' + input.max);
    }
}

// replace all placeholder English text on page with i18n text
function localize () {
    // set of CSS selector:textContent pairings
    var map = {
        'h1': 'optsTitle',
        'title': 'optsTitle',
        'label[for="loadstyle"]': 'optsLoadstyleLabel',
        '#loadstyle option[value="icon"]': 'optsLoadIcon',
        '#loadstyle option[value="dablink"]': 'optsLoadDablink',
        '#loadstyle option[value="auto"]': 'optsLoadAuto',
        'label[for="numresults"]': 'optsNumresultsLabel'
    };

    Object.keys(map).forEach(function (key) {
        // see https://developer.chrome.com/extensions/i18n
        // also https://developer.chrome.com/webstore/i18n
        d.querySelector(key).textContent = chrome.i18n.getMessage(map[key]);
    });
}

// replace placeholder form values with actual values from storage
function fillOptions () {
    // null => get all storage items
    storage.get(null, function (opts) {
        if (opts.loadstyle) {
            loadstyle.value = opts.loadstyle;
        }
        if (opts.numresults) {
            numresults.value = opts.numresults;
        }
    });
}

// eventListeners for page load
function listen () {
    // listen for changes then save them to storage
    loadstyle.addEventListener('change', onLoadstyleChange, false);
    numresults.addEventListener('change', onNumresultsChange, false);
}

// add event listeners, fill in stored options values
// replace text with localized strings
function init () {
    // replace text with localized strings
    localize();

    // fill in any already-selected options
    fillOptions();

    // eventListeners on form inputs
    listen();
}

// kick it off
d.addEventListener('DOMContentLoaded', init, false);
