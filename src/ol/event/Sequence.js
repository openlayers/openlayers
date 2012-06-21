goog.provide('ol.event.Sequence');

/**
 * @constructor
 */
ol.event.Sequence = function() {
    
    /**
       @private
       @type {Element}
     */
    this.element_ = null;
    
    /**
     * Event types provided by this sequence.
     * @enum {string}
     */
    this.eventTypes_ = {};

    /**
     * Event mappings provided by this sequence.
     * @enum {Object}
     */
    this.providedEvents_ = {};

};

/**
   @param {Element} element
 */
ol.event.Sequence.prototype.setElement = function(element) {
    this.element_ = element;
};

/**
   @return {Object}
 */
ol.event.Sequence.prototype.getProvidedEvents = function() {
    return this.providedEvents_;
};