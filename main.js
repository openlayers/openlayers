
goog.provide('ol');

goog.require('ol.map');
goog.require('goog.dom');

ol.main = function() {
    goog.dom.getElement('output').innerHTML = 'test';
    var map = ol.map().center([45, 5]);
    window.console.log(map.center());
}

window['main'] = ol.main;
// or goog.exportSymbol('main', hello.main);