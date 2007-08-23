/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * Class: OpenLayers.Popup
 *
 * A popup is a small div that can opened and closed on the map.
 * Typically opened in response to clicking on a marker.  
 * See <OpenLayers.Marker>.  Popup's don't require their own
 * layer and are added the the map using the <OpenLayers.Map.addPopup>
 * method.
 *
 * Example:
 * (code)
 * popup = new OpenLayers.Popup("chicken", 
 *                    new OpenLayers.LonLat(5,40),
 *                    new OpenLayers.Size(200,200),
 *                    "example popup",
 *                    true);
 *       
 * map.addPopup(popup);
 * (end)
 */
OpenLayers.Popup = OpenLayers.Class({

    /** 
     * Property: events  
     * {<OpenLayers.Events>} custom event manager 
     */
    events: null,
    
    /** Property: id
     * {String} the unique identifier assigned to this popup.
     */
    id: "",

    /** 
     * Property: lonlat 
     * {<OpenLayers.LonLat>} the position of this popup on the map
     */
    lonlat: null,

    /** 
     * Property: div 
     * {DOMElement} the div that contains this popup.
     */
    div: null,

    /** 
     * Property: size 
     * {<OpenLayers.Size>} the width and height of the popup.
     */
    size: null,    

    /** 
     * Property: contentHTML 
     * {String} The HTML that this popup displays.
     */
    contentHTML: "",
    
    /** 
     * Property: backgroundColor 
     * {String} the background color used by the popup.
     */
    backgroundColor: "",
    
    /** 
     * Property: opacity 
     * {float} the opacity of this popup (between 0.0 and 1.0)
     */
    opacity: "",

    /** 
     * Property: border 
     * {String} the border size of the popup.  (eg 2px)
     */
    border: "",
    
    /** 
     * Property: contentDiv 
     * {DOMElement} a reference to the element that holds the content of
     *              the div.
     */
    contentDiv: null,
    
    /** 
     * Property: groupDiv 
     * {DOMElement} the parent of <OpenLayers.Popup.contentDiv> 
     */
    groupDiv: null,

    /** 
     * Property: padding 
     * {int} the internal padding of the content div.
     */
    padding: 5,


    /** 
     * Property: map 
     * {<OpenLayers.Map>} this gets set in Map.js when the popup is added to the map
     */
    map: null,

    /** 
    * Constructor: OpenLayers.Popup
    * Create a popup.
    * 
    * Parameters: 
    * id - {String} a unqiue identifier for this popup.  If null is passed
    *               an identifier will be automatically generated. 
    * lonlat - {<OpenLayers.LonLat>}  The position on the map the popup will
    *                                 be shown.
    * size - {<OpenLayers.Size>}      The size of the popup.
    * contentHTML - {String}          The HTML content to display inside the 
    *                                 popup.
    * closeBox - {Boolean}            Whether to display a close box inside
    *                                 the popup. 
    */
    initialize:function(id, lonlat, size, contentHTML, closeBox) {
        if (id == null) {
            id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
        }

        this.id = id;
        this.lonlat = lonlat;
        this.size = (size != null) ? size 
                                  : new OpenLayers.Size(
                                                   OpenLayers.Popup.WIDTH,
                                                   OpenLayers.Popup.HEIGHT);
        if (contentHTML != null) { 
             this.contentHTML = contentHTML;
        }
        this.backgroundColor = OpenLayers.Popup.COLOR;
        this.opacity = OpenLayers.Popup.OPACITY;
        this.border = OpenLayers.Popup.BORDER;

        this.div = OpenLayers.Util.createDiv(this.id, null, null, 
                                             null, null, null, "hidden");
        this.div.className = 'olPopup';
        
        this.groupDiv = OpenLayers.Util.createDiv(null, null, null, 
                                                    null, "relative", null,
                                                    "hidden");

        var id = this.div.id + "_contentDiv";
        this.contentDiv = OpenLayers.Util.createDiv(id, null, this.size.clone(), 
                                                    null, "relative", null,
                                                    "hidden");
        this.contentDiv.className = 'olPopupContent';                                            
        this.groupDiv.appendChild(this.contentDiv);
        this.div.appendChild(this.groupDiv);

        if (closeBox == true) {
           // close icon
            var closeSize = new OpenLayers.Size(17,17);
            var img = OpenLayers.Util.getImagesLocation() + "close.gif";
            var closeImg = OpenLayers.Util.createAlphaImageDiv(this.id + "_close", 
                                                                null, 
                                                                closeSize, 
                                                                img);
            closeImg.style.right = this.padding + "px";
            closeImg.style.top = this.padding + "px";
            this.groupDiv.appendChild(closeImg);

            var closePopup = function(e) {
                this.hide();
                OpenLayers.Event.stop(e);
            }
            OpenLayers.Event.observe(closeImg, "click", 
                                     closePopup.bindAsEventListener(this));

        }

        this.registerEvents();
    },

    /** 
     * Method: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        if (this.map != null) {
            this.map.removePopup(this);
            this.map = null;
        }
        this.events.destroy();
        this.events = null;
        this.div = null;
    },

    /** 
    * Method: draw
    * Constructs the elements that make up the popup.
    *
    * Parameters:
    * px - {<OpenLayers.Pixel>} the position the popup in pixels.
    * 
    * Return:
    * {DOMElement} Reference to a div that contains the drawn popup
    */
    draw: function(px) {
        if (px == null) {
            if ((this.lonlat != null) && (this.map != null)) {
                px = this.map.getLayerPxFromLonLat(this.lonlat);
            }
        }
        
        this.setSize();
        this.setBackgroundColor();
        this.setOpacity();
        this.setBorder();
        this.setContentHTML();
        this.moveTo(px);

        return this.div;
    },

    /** 
     * Method: updatePosition
     * if the popup has a lonlat and its map members set, 
     * then have it move itself to its proper position
     */
    updatePosition: function() {
        if ((this.lonlat) && (this.map)) {
                var px = this.map.getLayerPxFromLonLat(this.lonlat);
                this.moveTo(px);            
        }
    },

    /**
     * Method: moveTo
     * 
     * Parameters:
     * px - {<OpenLayers.Pixel>} the top and left position of the popup div. 
     */
    moveTo: function(px) {
        if ((px != null) && (this.div != null)) {
            this.div.style.left = px.x + "px";
            this.div.style.top = px.y + "px";
        }
    },

    /**
     * Method: visible
     *
     * Returns:      
     * {Boolean} Boolean indicating whether or not the popup is visible
     */
    visible: function() {
        return OpenLayers.Element.visible(this.div);
    },

    /**
     * Method: toggle
     * Toggles visibility of the popup.
     */
    toggle: function() {
        OpenLayers.Element.toggle(this.div);
    },

    /**
     * Method: show
     * Makes the popup visible.
     */
    show: function() {
        OpenLayers.Element.show(this.div);
    },

    /**
     * Method: hide
     * Makes the popup invisible.
     */
    hide: function() {
        OpenLayers.Element.hide(this.div);
    },

    /**
     * Method: setSize
     * Used to adjust the size of the popup. 
     *
     * Parameters:
     * size - {<OpenLayers.Size>} the new size of the popup in pixels.
     */
    setSize:function(size) { 
        if (size != undefined) {
            this.size = size; 
        }
        
        if (this.div != null) {
            this.div.style.width = this.size.w + "px";
            this.div.style.height = this.size.h + "px";
        }
        if (this.contentDiv != null){
            this.contentDiv.style.width = this.size.w + "px";
            this.contentDiv.style.height = this.size.h + "px";
        }
    },  

    /**
    * Method: setBackgroundColor
    * Sets the background color of the popup.
    * Parameters:
    * color - {String} the background color.  eg "#FFBBBB"
    */
    setBackgroundColor:function(color) { 
        if (color != undefined) {
            this.backgroundColor = color; 
        }
        
        if (this.div != null) {
            this.div.style.backgroundColor = this.backgroundColor;
        }
    },  
    
    /**
     * Method: setOpacity
     * Sets the opacity of the popup.
     * 
     * Parameters:
     * opacity - {float} A value between 0.0 (transparent) and 1.0 (solid).   
     */
    setOpacity:function(opacity) { 
        if (opacity != undefined) {
            this.opacity = opacity; 
        }
        
        if (this.div != null) {
            // for Mozilla and Safari
            this.div.style.opacity = this.opacity;

            // for IE
            this.div.style.filter = 'alpha(opacity=' + this.opacity*100 + ')';
        }
    },  
    
    /**
     * Method: setBorder
     * Sets the border style of the popup.
     *
     * Parameters:
     * border - {String} The border style value. eg 2px 
     */
    setBorder:function(border) { 
        if (border != undefined) {
            this.border = border;
        }
        
        if (this.div != null) {
            this.div.style.border = this.border;
        }
    },      
    
    /**
     * Method: setContentHTML
     * Allows the user to set the HTML content of the popup.
     *
     * Parameters:
     * contentHTML - {String} HTML for the div.
     */
    setContentHTML:function(contentHTML) {
        if (contentHTML != null) {
            this.contentHTML = contentHTML;
        }
        
        if (this.contentDiv != null) {
            this.contentDiv.innerHTML = this.contentHTML;
        }    
    },
    

    
    /** 
     * Method: registerEvents
     * Registers events on the popup.
     *
     * Do this in a separate function so that subclasses can 
     *   choose to override it if they wish to deal differently
     *   with mouse events
     * 
     *   Note in the following handler functions that some special
     *    care is needed to deal correctly with mousing and popups. 
     *   
     *   Because the user might select the zoom-rectangle option and
     *    then drag it over a popup, we need a safe way to allow the
     *    mousemove and mouseup events to pass through the popup when
     *    they are initiated from outside.
     * 
     *   Otherwise, we want to essentially kill the event propagation
     *    for all other events, though we have to do so carefully, 
     *    without disabling basic html functionality, like clicking on 
     *    hyperlinks or drag-selecting text.
     */
     registerEvents:function() {
        this.events = new OpenLayers.Events(this, this.div, null, true);

        this.events.register("mousedown", this, this.onmousedown);
        this.events.register("mousemove", this, this.onmousemove);
        this.events.register("mouseup", this, this.onmouseup);
        this.events.register("click", this, this.onclick);
        this.events.register("mouseout", this, this.onmouseout);
        this.events.register("dblclick", this, this.ondblclick);
     },

    /** 
     * Method: onmousedown 
     * When mouse goes down within the popup, make a note of
     *   it locally, and then do not propagate the mousedown 
     *   (but do so safely so that user can select text inside)
     * 
     * Parameters:
     * evt - {Event} 
     */
    onmousedown: function (evt) {
        this.mousedown = true;
        OpenLayers.Event.stop(evt, true);
    },

    /** 
     * Method: onmousemove
     * If the drag was started within the popup, then 
     *   do not propagate the mousemove (but do so safely
     *   so that user can select text inside)
     * 
     * Parameters:
     * evt - {Event} 
     */
    onmousemove: function (evt) {
        if (this.mousedown) {
            OpenLayers.Event.stop(evt, true);
        }
    },

    /** 
     * Method: onmouseup
     * When mouse comes up within the popup, after going down 
     *   in it, reset the flag, and then (once again) do not 
     *   propagate the event, but do so safely so that user can 
     *   select text inside
     * 
     * Parameters:
     * evt - {Event} 
     */
    onmouseup: function (evt) {
        if (this.mousedown) {
            this.mousedown = false;
            OpenLayers.Event.stop(evt, true);
        }
    },

    /**
     * Method: onclick
     * Ignore clicks, but allowing default browser handling
     * 
     * Parameters:
     * evt - {Event} 
     */
    onclick: function (evt) {
        OpenLayers.Event.stop(evt, true);
    },

    /** 
     * Method: onmouseout
     * When mouse goes out of the popup set the flag to false so that
     *   if they let go and then drag back in, we won't be confused.
     * 
     * Parameters:
     * evt - {Event} 
     */
    onmouseout: function (evt) {
        this.mousedown = false;
    },
    
    /** 
     * Method: ondblclick
     * Ignore double-clicks, but allowing default browser handling
     * 
     * Parameters:
     * evt - {Event} 
     */
    ondblclick: function (evt) {
        OpenLayers.Event.stop(evt, true);
    },

    CLASS_NAME: "OpenLayers.Popup"
});

OpenLayers.Popup.WIDTH = 200;
OpenLayers.Popup.HEIGHT = 200;
OpenLayers.Popup.COLOR = "white";
OpenLayers.Popup.OPACITY = 1;
OpenLayers.Popup.BORDER = "0px";
