
goog.provide('ga.Lang');
goog.require('goog.object');

ga.Lang = function() {

    this.code = null;

    this.defaultCode = 'en';

    goog.base(this);

};
goog.inherits(ga.Lang, goog.object);



ga.Lang.prototype.getCode = function() {
    if (!this.code) {
      this.setCode();
    }
    return this.code;
};
goog.exportProperty(
  ga.Lang.prototype,
  'getCode',
  ol.Map.prototype.getCode);

ga.Lang.prototype.setCode = function(code) {
    this.code = code;
};
goog.exportProperty(
  ga.Lang.prototype,
  'setCode',
  ol.Map.prototype.setCode);

ga.Lang.prototype.translate = function(key, context) {

  var dictionary = ga.Lang[OpenLayers.Lang.getCode()];
  var message = dictionary && dictionary[key];
  if (!message) {
    // Message not found, fall back to message key
    message = key;
  }
  if (context) {
    message = message.format(context);
  }
  return message;
};



