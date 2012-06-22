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
     * Activate this control when it is added to a map.  Default is true.
     *
     * @type {boolean} autoActivate
     */
    this.autoActivate_ =
        goog.isDef(opt_autoActivate) ? opt_autoActivate : true;
    
};
goog.inherits(ol.control.Zoom, ol.control.Control);

/**
 * @param {ol.Map} map
 */
ol.control.Zoom.prototype.setMap = function(map) {
    goog.base(this, 'setMap', map);
    var container = goog.dom.createDom('div', ol.control.Zoom.RES.CLS);
    var inButton = goog.dom.createDom(
        'div', ol.control.Zoom.RES.IN_CLS,
        goog.dom.createDom('a', {'href': '#zoomIn'})
    );
    goog.dom.setTextContent(
        /** @type {Element} */ (inButton.firstChild),
        ol.control.Zoom.RES.IN_TEXT
    );
    var outButton = goog.dom.createDom(
        'div', ol.control.Zoom.RES.OUT_CLS,
        goog.dom.createDom('a', {'href': '#zoomOut'})
    );
    goog.dom.setTextContent(
        /** @type {Element} */ (outButton.firstChild),
        ol.control.Zoom.RES.OUT_TEXT
    );
    goog.dom.append(container, inButton, outButton);

    var viewport = /** @type {Node} */ map.getViewport();
    if (goog.isDefAndNotNull(viewport)) {
        goog.dom.append(viewport, container);
    }
};

/** @inheritDoc */
ol.control.Zoom.prototype.activate = function() {
    var active = goog.base(this, 'activate');
    if (active) {
        this.getMap().getEvents().register("click", this.handle, this);
    }
    return active;
};

/** @inheritDoc */
ol.control.Zoom.prototype.deactivate = function() {
    var inactive = goog.base(this, 'deactivate');
    if (inactive) {
        this.getMap().getEvents().unregister("click", this.handle, this);
    }
    return inactive;
};

/**
 * @param {Event} evt
 */
ol.control.Zoom.prototype.handle = function(evt) {
    var target = /** @type {Node} */ (evt.target),
        handled = false;
    if (goog.dom.getAncestorByClass(target, ol.control.Zoom.RES.IN_CLS)) {
        this.getMap().zoomIn();
        handled = true;
    } else
    if (goog.dom.getAncestorByClass(target, ol.control.Zoom.RES.OUT_CLS)) {
        this.getMap().zoomOut();
        handled = true;
    }
    if (handled) {
        evt.preventDefault();
    }
    return !handled;
};

ol.control.addControl('zoom', ol.control.Zoom);

ol.control.Zoom.RES = {
    CLS: 'ol-control-zoom',
    IN_CLS: 'ol-control-zoom-in',
    OUT_CLS: 'ol-control-zoom-out',
    IN_TEXT: '+',
    OUT_TEXT: '\u2013'
};