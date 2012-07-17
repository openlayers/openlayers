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
        goog.events.listen(this.map_, 'dragend', this.removeBox, false, this);
    }
    return active;
};

/** @inheritDoc */
ol.control.ZoomBox.prototype.deactivate = function() {
    var inactive = goog.base(this, 'deactivate');
    if (inactive) {
        goog.events.unlisten(this.map_, 'dragstart', this.createBox, false, this);
        goog.events.unlisten(this.map_, 'dragend', this.removeBox, false, this);
    }
    return inactive;
};

ol.control.ZoomBox.prototype.createBox = function(evt) {
    if (!evt.originalEvent.browserEvent.shiftKey) {
        return;
    }
    this.box_ = goog.dom.createDom('div', {
        'class': 'ol-control-zoombox-box',
        'style': 'position:absolute;z-index:1'
    });
    goog.dom.append(/** @type {!Node} */ (this.map_.getMapOverlay()), this.box_);
    var borderBox = goog.style.getBorderBox(this.box_);
    this.pos_ = goog.math.Coordinate.sum(
        goog.style.getRelativePosition(evt.originalEvent, this.map_.getViewport()),
        new goog.math.Coordinate(-borderBox.left, -borderBox.top)
    );
    this.updateBox(evt);
    goog.events.listen(this.map_, 'drag', this.updateBox, false, this);
};

ol.control.ZoomBox.prototype.updateBox = function(evt) {
    this.width_ += (evt.deltaX || 0);
    this.height_ += (evt.deltaY || 0);
    this.box_.style.left = (this.pos_.x + (this.width_ > 0 ? 0 : this.width_)) + 'px';
    this.box_.style.top = (this.pos_.y + (this.height_ > 0 ? 0 : this.height_)) + 'px';
    this.box_.style.width = Math.abs(this.width_) + 'px';
    this.box_.style.height = Math.abs(this.height_) + 'px';
    evt.preventDefault();
};

ol.control.ZoomBox.prototype.removeBox = function(evt) {
    goog.events.unlisten(this.map_, 'drag', this.updateBox, false, this);
    goog.dom.removeNode(this.box_);
    if (this.width_ && this.height_) {
        var resolution = this.map_.getResolution(),
            size = this.map_.getViewportSize(),
            xRes = resolution * this.width_/size.width,
            yRes = resolution * this.height_/size.height;
        goog.asserts.assert(this.pos_);
        this.map_.setCenterAndZoom(
            this.map_.getLocForViewportPixel(
                goog.math.Coordinate.sum(
                    this.pos_,
                    new goog.math.Coordinate(this.width_ / 2, this.height_ / 2)
                )
            ),
            Math.floor(this.map_.getZoomForResolution(Math.max(xRes, yRes)))
        );
    }
    this.box_ = null;
    this.width_ = 0;
    this.height_ = 0;
};

ol.control.addControl('zoombox', ol.control.ZoomBox);