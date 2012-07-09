goog.provide('ol.control.Attribution');

goog.require('ol.event');
goog.require('ol.control.Control');

goog.require('goog.dom');


/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {boolean|undefined} opt_autoActivate
 */
ol.control.Attribution = function(opt_autoActivate) {

    goog.base(this, opt_autoActivate);
    
    /**
     * @type {Node}
     */
    this.container_ = null;

    /**
     * Activate this control when it is added to a map.  Default is true.
     *
     * @type {boolean} autoActivate
     */
    this.autoActivate_ =
        goog.isDef(opt_autoActivate) ? opt_autoActivate : true;
    
};
goog.inherits(ol.control.Attribution, ol.control.Control);

/**
 * @const {string}
 */
ol.control.Attribution.prototype.CLS = 'ol-control-attribution';

/**
 * @param {ol.Map} map
 */
ol.control.Attribution.prototype.setMap = function(map) {
    var staticOverlay = map.getStaticOverlay();
    if (goog.isNull(this.container_)) {
        this.container_ = goog.dom.createDom('div', this.CLS);
        goog.events.listen(this.container_, 'click', ol.event.stopPropagation);
    }
    if (!goog.isNull(staticOverlay)) {
        goog.dom.append(staticOverlay, this.container_);
    }
    goog.base(this, 'setMap', map);
};

/** @inheritDoc */
ol.control.Attribution.prototype.activate = function() {
    var active = goog.base(this, 'activate');
    if (active) {
        goog.events.listen(this.map_, 'layeradd', this.update,
                           undefined, this);
        this.update();
    }
    return active;
};

/** @inheritDoc */
ol.control.Attribution.prototype.deactivate = function() {
    var inactive = goog.base(this, 'deactivate');
    if (inactive) {
        goog.events.unlisten(this.map_, 'layeradd', this.update,
                             undefined, this);
    }
    return inactive;
};

ol.control.Attribution.prototype.update = function() {
    var attribution = [],
        layers = this.map_.getLayers(), layerAttribution;
    for (var i=0, ii=layers.length; i<ii; ++i) {
        layerAttribution = layers[i].getAttribution();
        if (layerAttribution &&
           !~goog.array.indexOf(attribution, layerAttribution)) {
            attribution.push(layerAttribution);
        }
    }
    this.container_.innerHTML = attribution.join(', ');
};

ol.control.Attribution.prototype.destroy = function() {
    goog.events.unlisten(this.container_, 'click', ol.event.stopPropagation);
    goog.dom.removeNode(this.container_);
    goog.base(this, 'destroy');
};

ol.control.addControl('attribution', ol.control.Attribution);
