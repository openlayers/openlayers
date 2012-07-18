goog.provide('ol.control.ZoomBox');

goog.require('ol.control.Control');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.style');


/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {boolean|undefined} opt_autoActivate
 */
ol.control.ZoomBox = function(opt_autoActivate) {
    
    goog.base(this, opt_autoActivate);

    /**
     * @type {Node}
     */
    this.box_ = null;
    
    /**
     * @type {number}
     */
    this.width_ = 0;
    
    /**
     * @type {number}
     */
    this.height_ = 0;
    
    /**
     * @type {goog.math.Coordinate}
     */
    this.pos_ = null;

    /**
     * Activate this control when it is added to a map.  Default is true.
     *
     * @type {boolean} 
     */
    this.autoActivate_ =
        goog.isDef(opt_autoActivate) ? opt_autoActivate : true;
    
};
goog.inherits(ol.control.ZoomBox, ol.control.Control);

/** @inheritDoc */
ol.control.ZoomBox.prototype.activate = function() {
    var active = goog.base(this, 'activate');
    if (active) {
        goog.events.listen(this.map_, 'dragstart', this.createBox, false, this);
        goog.events.listen(this.map_, 'dragend', this.zoom, false, this);
    }
    return active;
};

/** @inheritDoc */
ol.control.ZoomBox.prototype.deactivate = function() {
    var inactive = goog.base(this, 'deactivate');
    if (inactive) {
        goog.events.unlisten(this.map_, 'dragstart', this.createBox, false, this);
        goog.events.unlisten(this.map_, 'dragend', this.zoom, false, this);
    }
    return inactive;
};

/**
 * @param {ol.events.MapEvent} evt
 */
ol.control.ZoomBox.prototype.createBox = function(evt) {
    if (!evt.originalEvent.browserEvent.shiftKey) {
        return;
    }
    this.box_ = goog.dom.createDom('div', {
        'class': 'ol-control-zoombox-box',
        'style': 'position:absolute;z-index:1'
    });
    goog.asserts.assert(this.map_.getMapOverlay());
    goog.dom.append(/** @type {!Node} */ (this.map_.getMapOverlay()), this.box_);
    var borderBox = goog.style.getBorderBox(this.box_);
    this.pos_ = goog.math.Coordinate.sum(
        goog.style.getRelativePosition(evt.originalEvent, this.map_.getViewport()),
        new goog.math.Coordinate(-borderBox.left, -borderBox.top)
    );
    this.updateBox(evt);
    goog.events.listen(this.map_, 'drag', this.updateBox, false, this);
};

/**
 * @param {ol.events.MapEvent} evt
 */
ol.control.ZoomBox.prototype.updateBox = function(evt) {
    this.width_ += (evt.deltaX || 0);
    this.height_ += (evt.deltaY || 0);
    var style = this.box_.style, w = this.width_, h = this.height_, px = 'px';
    style.left = (this.pos_.x + (w > 0 ? 0 : w)) + px;
    style.top = (this.pos_.y + (h > 0 ? 0 : h)) + px;
    style.width = Math.abs(w) + px;
    style.height = Math.abs(h) + px;
    evt.preventDefault();
};

/**
 */
ol.control.ZoomBox.prototype.removeBox = function() {
    goog.events.unlisten(this.map_, 'drag', this.updateBox, false, this);
    goog.dom.removeNode(this.box_);
    this.box_ = null;
    this.width_ = 0;
    this.height_ = 0;
};

/**
 * @param {ol.events.MapEvent} evt
 */
ol.control.ZoomBox.prototype.zoom = function(evt) {
    goog.asserts.assert(this.pos_);
    var w = this.width_, h = this.height_;
    if (w && h) {
        var resolution = this.map_.getResolution(),
            size = this.map_.getViewportSize();
        this.map_.setCenterAndZoom(this.map_.getLocForViewportPixel(
            goog.math.Coordinate.sum(
                this.pos_, new goog.math.Coordinate(w / 2, h / 2)
            )),
            Math.floor(this.map_.getZoomForResolution(Math.max(
                resolution * w / size.width, resolution * h / size.height
            )))
        );
    }
    this.removeBox();
};

ol.control.addControl('zoombox', ol.control.ZoomBox);