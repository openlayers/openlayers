goog.provide('ol.control.Zoom');

goog.require('ol.control.Control');

goog.require('goog.dom');


/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {boolean|undefined} opt_autoActivate
 */
ol.control.Zoom = function(opt_autoActivate) {
    
    goog.base(this, opt_autoActivate);

    /**
     * @type {Node}
     */
    this.inButton_ = null;

    /**
     * @type {Node}
     */
    this.outButton_ = null;

    /**
     * Activate this control when it is added to a map.  Default is true.
     *
     * @type {boolean} 
     */
    this.autoActivate_ =
        goog.isDef(opt_autoActivate) ? opt_autoActivate : true;
    
};
goog.inherits(ol.control.Zoom, ol.control.Control);

/**
 * @param {ol.Map} map
 */
ol.control.Zoom.prototype.setMap = function(map) {
    var container = goog.dom.createDom('div', ol.control.Zoom.RES.CLS);
    this.inButton_ = goog.dom.createDom(
        'div', ol.control.Zoom.RES.IN_CLS,
        goog.dom.createDom('a', {'href': '#zoomIn'})
    );
    goog.dom.setTextContent(
        /** @type {Element} */ (this.inButton_.firstChild),
        ol.control.Zoom.RES.IN_TEXT
    );
    this.outButton_ = goog.dom.createDom(
        'div', ol.control.Zoom.RES.OUT_CLS,
        goog.dom.createDom('a', {'href': '#zoomOut'})
    );
    goog.dom.setTextContent(
        /** @type {Element} */ (this.outButton_.firstChild),
        ol.control.Zoom.RES.OUT_TEXT
    );
    goog.dom.append(container, this.inButton_, this.outButton_);

    var overlay = map.getStaticOverlay();
    if (goog.isDefAndNotNull(overlay)) {
        goog.dom.append(overlay, container);
    }
    goog.base(this, 'setMap', map);
};

/** @inheritDoc */
ol.control.Zoom.prototype.activate = function() {
    var active = goog.base(this, 'activate');
    if (active) {
        goog.events.listen(this.inButton_, 'click', this.handleIn, false, this);
        goog.events.listen(this.outButton_, 'click', this.handleOut, false, this);
    }
    return active;
};

/** @inheritDoc */
ol.control.Zoom.prototype.deactivate = function() {
    var inactive = goog.base(this, 'deactivate');
    if (inactive) {
        goog.events.unlisten(this.inButton_, 'click', this.handleIn, false, this);
        goog.events.unlisten(this.outButton_, 'click', this.handleOut, false, this);
    }
    return inactive;
};

/**
 * @param {Event} evt
 */
ol.control.Zoom.prototype.handleIn = function(evt) {
    this.map_.zoomIn();
    evt.preventDefault();
    evt.stopPropagation();
};

/**
 * @param {Event} evt
 */
ol.control.Zoom.prototype.handleOut = function(evt) {
    this.map_.zoomOut();
    evt.preventDefault();
    evt.stopPropagation();
};

ol.control.Zoom.prototype.destroy = function() {
    goog.dom.removeNode(goog.dom.getElementByClass(
        ol.control.Zoom.RES.CLS,
        /** @type {Element} */ (this.map_.getStaticOverlay())
    ));
    goog.base(this, 'destroy');
};

ol.control.addControl('zoom', ol.control.Zoom);

ol.control.Zoom.RES = {
    CLS: 'ol-control-zoom',
    IN_CLS: 'ol-control-zoom-in',
    OUT_CLS: 'ol-control-zoom-out',
    IN_TEXT: '+',
    OUT_TEXT: '−'
};
