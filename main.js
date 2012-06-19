
goog.provide('ol');

goog.require('ol.map');
goog.require('goog.dom');

var map;
ol.main = function() {
    goog.dom.getElement('output').innerHTML = 'test';
    map = ol.map().center([45, 5]);
};

window['main'] = ol.main;
goog.exportSymbol('map', map);
