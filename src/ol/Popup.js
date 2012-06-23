goog.provide('ol.Popup');

goog.require('ol.Map');
goog.require('ol.Loc');
goog.require('ol.Feature');


/**
 * @export
 * @constructor
 * @param {ol.Map} map the map on which the popup is placed.
 * @param {ol.Loc|ol.Feature=} opt_anchor the anchor object for the popup.
 * @param {string=} opt_placement the placement of the arrow on the popup.
 * @param {boolean=} opt_close include a close button on the popup
 */
ol.Popup = function(map, opt_anchor, opt_placement, opt_close) {

    /**
     * @private
     * @type {ol.Map}
     */
    this.map_ = map;
    
    /**
     * @private
     * @type {ol.Loc|ol.Feature|undefined}
     */
    this.anchor_ = opt_anchor;
    
    /**
     * can be 'top','bottom','right','left','auto'
     * TODO: 'auto' not yet implemented
     * @private
     * @type {!string}
     */
     this.placement_ = goog.isDefAndNotNull(opt_placement)?opt_placement:'top';
    
    /**
     * include a close button on the popup - defaults to true.
     * @private
     * @type {boolean|undefined}
     */
    this.closeButton_ = goog.isDefAndNotNull(opt_close) ? opt_close : true;
    
    /**
     * @private
     * @type {string|undefined}
     */
    this.content_ = undefined;
    
    /**
     * @private
     * @type {string|undefined}
     */
    this.template_ = undefined;
    
    /**
     * @private
     * @type {Element}
     */
    this.container_ = null;
    
    /**
     * @private
     * @type {number}
     */
    this.arrowOffset_ = 30; //FIXME: set this from CSS dynamically somehow?
    
    /**
     * if the CSS sets either width or height assume the app is specifying the
     * size of the popup, if not auto size the popup.
     * @private
     * @type {boolean}
     */
    this.autoSize_ = true;
    
};

/**
 * @const
 */
ol.Popup.CLASS_NAME = 'ol-popup';

/**
 * @return {ol.Map} Projection.
 */
ol.Popup.prototype.getMap = function() {
    return this.map_;
};

/**
 * @param {ol.Map} map the map object to hold this popup.
 */
ol.Popup.prototype.setMap = function(map) {
    this.map_ = map;
};

/**
 * @return {ol.Feature|ol.Loc|undefined} the anchor .
 */
ol.Popup.prototype.getAnchor = function() {
    return this.anchor_;
};

/**
 * @param {ol.Feature|ol.Loc} anchor the anchor location to place this popup.
 */
ol.Popup.prototype.setAnchor = function(anchor) {
    this.anchor_ = anchor;
};


/**
 * @return {string|undefined} the placement value relative to the anchor.
 */
ol.Popup.prototype.getPlacement = function() {
    return this.placement_;
};

/**
 * @param {string} placement where to place this popup relative to the anchor.
 */
ol.Popup.prototype.setPlacement = function(placement) {
    if (!goog.isNull(this.container_)) {
        goog.dom.classes.remove(this.container_, 
                               ol.Popup.CLASS_NAME+'-'+this.placement_);
        goog.dom.classes.add(this.container_,ol.Popup.CLASS_NAME+'-'+placement);
    }
    this.placement_ = placement;
};


/**
 * @return {string|undefined} static content to be displayed in the popup (HTML)
 */
ol.Popup.prototype.getContent = function() {
    return this.content_;
};

/**
 * @param {string} content the content to be displayed this popup.
 */
ol.Popup.prototype.setContent = function(content) {
    this.content_ = content;
};


/**
 * @private
 * @returns {string} generates the content
 */
ol.Popup.prototype.generateContent_ = function() {
    //set the content
    if ( goog.isDefAndNotNull(this.content_) ) {
        return this.content_;
    } else {
        if ( goog.isDefAndNotNull(this.template_) && 
             goog.isDefAndNotNull(this.anchor_) &&
            (this.anchor_ instanceof ol.Feature)) {
            //set content from feature attributes on the template
            //TODO: this.setContent(template.apply(this.anchor_.getAttributes()));
            return this.template_; //stub to return something
        } else {
            ol.error('ol.Popup unabale to generate any content');
            return '<p>no content</p>';
        }
    }
};


/**
 * @return {string|undefined} the anchor .
 */
ol.Popup.prototype.getTemplate = function() {
    return this.template_;
};

/**
 * @param {string} template the map object to hold this popup.
 */
ol.Popup.prototype.setTemplate = function(template) {
    this.template_ = template;
};

/**
 * Open the popup.
 * @export
 * @param {ol.Feature|ol.Loc} opt_arg feature or location for the anchor
 */
ol.Popup.prototype.open = function(opt_arg) {
    if (goog.isDef(opt_arg)) {
        this.setAnchor(opt_arg);
    }
    
    //create popup container if it's not created already
    if (goog.isNull(this.container_)) {
        this.container_ = goog.dom.createElement('div');
        goog.dom.classes.add(this.container_, 
            ol.Popup.CLASS_NAME, ol.Popup.CLASS_NAME+'-'+this.placement_);
        
        //see if the style class sets width or height
        if (goog.style.getStyle(this.container_, 'width').length>0 ||
            goog.style.getStyle(this.container_, 'height').length>0 ) {
            this.autoSize_ = false;
        }
        
        if (this.closeButton_) {
            var closeButton = goog.dom.createElement('div');
            goog.dom.appendChild(this.container_, closeButton);
            goog.dom.classes.add(closeButton,  ol.Popup.CLASS_NAME+'-close');
        }
        this.map_.getEvents().register('click', this.clickHandler, this);
        goog.dom.appendChild(this.map_.getMapOverlay(), this.container_);
    }
    
    this.childContent_=goog.dom.htmlToDocumentFragment(this.generateContent_());
    goog.dom.appendChild(this.container_, this.childContent_);

    if (this.autoSize_) {
        this.registerImageListeners();
    }
    
    this.setAnchorOffset_();
};

ol.Popup.prototype.setAnchorOffset_ = function() {
    
    if (goog.isNull(this.container_.parentNode)) {
        //this means the popup has already been closed, nothing to do here
        //which might happen while waiting for images to load
        return;
    }
    
    if (!goog.isDefAndNotNull(this.anchor_)) {
        //must have an anchor when trying to set the position
        ol.error("ol.Popup must have an anchor to set the position");
        return;
    }
    
    //position the element
    if (this.anchor_ instanceof ol.Feature) {
        this.pos_ = this.anchor_.getGeometry().getCentroid();
    } else {
        this.pos_ = new ol.geom.Point(this.anchor_.getX(), this.anchor_.getY());
    }
    var pos = /** @type {ol.Loc} */ (this.pos_);
    var popupPosPx = this.map_.getPixelForLoc(pos);
    var popupSize = goog.style.getSize(this.container_);
    
    switch(this.placement_) {
        default:
        case 'auto':
            //TODO: switch based on map quadrant
            break;
        case 'top':
        case 'bottom':
            popupPosPx[0] -= popupSize.width / 2.0;

            if (this.placement_ == "bottom") {
                popupPosPx[1] -= popupSize.height + this.arrowOffset_;
            } else {
                popupPosPx[1] += this.arrowOffset_;
            }
            break;
        case 'left':
        case 'right':
            popupPosPx[1] -= popupSize.height / 2.0;

            if (this.placement_ == "right") {
                popupPosPx[0] -= popupSize.width + this.arrowOffset_;
            } else {
                popupPosPx[0] += this.arrowOffset_;
            }
            break;
    }
    this.moveTo_(popupPosPx);
    
};

/**
 * registerImageListeners
 * Called when an image contained by the popup loaded. this function
 *     updates the popup size, then unregisters the image load listener.
 */   
ol.Popup.prototype.registerImageListeners = function() {

    // As the images load, this function will call setAnchorOffset_() to 
    // resize the popup to fit the content div (which presumably is now
    // bigger than when the image was not loaded).
    // 
    //cycle through the images and if their size is 0x0, that means that 
    // they haven't been loaded yet, so we attach the listener, which 
    // will fire when the images finish loading and will resize the 
    // popup accordingly to its new size.
    var images = this.container_.getElementsByTagName("img");
    for (var i = 0, len = images.length; i < len; i++) {
        var img = images[i];
        if (img.width == 0 || img.height == 0) {
            goog.events.listenOnce(img, 'load', 
                                goog.bind(this.setAnchorOffset_, this));
        }    
    } 
};


/**
 * @param px - {goog.} the top and left position of the popup div. 
 */
ol.Popup.prototype.moveTo_ = function(px) {
    if (goog.isDefAndNotNull(px)) {
        goog.style.setPosition(this.container_, px[0], px[1]);
    }
};

/**
 * Click handler
 * @param {Event} evt the event generated by a click
 */
ol.Popup.prototype.clickHandler = function(evt) {
    var target = /** @type {Node} */ evt.target;
    if (goog.dom.classes.has(target,ol.Popup.CLASS_NAME+'-close')) {
        this.close();
    }
};

/**
 * Clean up.
 * @export
 */
ol.Popup.prototype.close = function() {
    goog.dom.removeChildren(this.container_);
    goog.dom.removeNode(this.container_);
};

/**
 * Clean up.
 * @export
 */
ol.Popup.prototype.destroy = function() {
    for (var key in this) {
        delete this[key];
    }
};
