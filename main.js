
goog.provide('ol');

goog.require('ol.Map');
goog.require('goog.dom');

ol.main = function() {
	goog.dom.getElement('output').innerHTML = 'test';
}

window['main'] = ol.main;
// or goog.exportSymbol('main', hello.main);