'use strict';

var d = document
    , loadstyle = d.getElementById('loadstyle')
    , numresults = d.getElementById('numresults')
    // see https://developer.chrome.com/extensions/storage
    , storage = chrome.storage.sync;

// callback fired whenever any form el changes
function storageSet () {
    var p = d.createElement('p'),
        // div for putting information items
        notices = d.getElementsByClassName('notices')[0];

    console.log('options updated');

    p.textContent = chrome.i18n.getMessage('optsSuccessfulUpdate');
    p.className = ['bg-success col-sm-offset-3'];

    // @todo should animate, this is terrible
    notices.appendChild(p);

    // remove the notice in 2.5s
    timeout = setTimeout(function(){
        notices.removeChild(p);
    }, 2500);
}

function onLoadstyleChange (ev) {
    storage.set({ 'loadstyle': ev.target.value}, storageSet);
}

// used in onNumresultsChange to force an appropriate value
function limitNum (num, min, max) {
    // input values are text by default, parse into integer
    var int = parseInt(num, 10);

    if (int < min) {
        return min;
    }

    return num > max ? max : num;
}

function onNumresultsChange (ev) {
    // @todo min, max should be based in DOM (props on the el)
    storage.set({ 'numresults': limitNum(ev.target.value, 1, 10) }, storageSet);
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

// add event listeners, fill in stored options values
// replace text with localized strings
function init () {
    // replace text with localized strings
    localize();

    // fill in any already-selected options
    fillOptions();

    // listen for changes then save them to storage
    loadstyle.addEventListener('change', onLoadstyleChange, false);
    numresults.addEventListener('change', onNumresultsChange, false);
}

// kick it off
d.addEventListener('DOMContentLoaded', init, false);
