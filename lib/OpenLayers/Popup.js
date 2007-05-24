/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 */
OpenLayers.Popup = OpenLayers.Class.create();

OpenLayers.Popup.WIDTH = 200;
OpenLayers.Popup.HEIGHT = 200;
OpenLayers.Popup.COLOR = "white";
OpenLayers.Popup.OPACITY = 1;
OpenLayers.Popup.BORDER = "0px";

OpenLayers.Popup.prototype = {

    /** @type OpenLayers.Events*/
    events: null,
    
    /** @type String */
    id: "",

    /** @type OpenLayers.LonLat */
    lonlat: null,

    /** @type DOMElement */
    div: null,

    /** @type OpenLayers.Size*/
    size: null,    

    /** @type String */
    contentHTML: "",
    
    /** @type String */
    backgroundColor: "",
    
    /** @type float */
    opacity: "",

    /** @type String */
    border: "",
    
    /** @type DOMElement */
    contentDiv:null,
    
    /** @type DOMElement */
    groupDiv:null,

    /** @type int */
    padding: 5,


    /** this gets set in Map.js when the popup is added to the map
     * @type OpenLayers.Map */
    map: null,

    /** 
    * @constructor
    * 
    * @param {String} id
    * @param {OpenLayers.LonLat} lonlat
    * @param {OpenLayers.Size} size
    * @param {String} contentHTML
    * @param {Boolean} closeBox
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
    * @param {OpenLayers.Pixel} px
    * 
    * @returns Reference to a div that contains the drawn popup
    * @type DOMElement
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
     * if the popup has a lonlat and its map members set, 
     *  then have it move itself to its proper position
     */
    updatePosition: function() {
        if ((this.lonlat) && (this.map)) {
                var px = this.map.getLayerPxFromLonLat(this.lonlat);
                this.moveTo(px);            
        }
    },

    /**
    * @param {OpenLayers.Pixel} px
    */
    moveTo: function(px) {
        if ((px != null) && (this.div != null)) {
            this.div.style.left = px.x + "px";
            this.div.style.top = px.y + "px";
        }
    },

    /**
     * @returns Boolean indicating whether or not the popup is visible
     * @type Boolean
     */
    visible: function() {
        return OpenLayers.Element.visible(this.div);
    },

    /**
     * 
     */
    toggle: function() {
        OpenLayers.Element.toggle(this.div);
    },

    /**
     *
     */
    show: function() {
        OpenLayers.Element.show(this.div);
    },

    /**
     *
     */
    hide: function() {
        OpenLayers.Element.hide(this.div);
    },

    /**
    * @param {OpenLayers.Size} size
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
    * @param {String} color
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
    * @param {float} opacity
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
    * @param {int} border
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
     * @param {String} contentHTML
     */
    setContentHTML:function(contentHTML) {
        if (contentHTML != null) {
            this.contentHTML = contentHTML;
        }
        
        if (this.contentDiv != null) {
            this.contentDiv.innerHTML = this.contentHTML;
        }    
    },
    

    
    /** Do this in a separate function so that subclasses can 
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

    /** When mouse goes down within the popup, make a note of
     *   it locally, and then do not propagate the mousedown 
     *   (but do so safely so that user can select text inside)
     * 
     * @param {Event} evt
     */
    onmousedown: function (evt) {
        this.mousedown = true;
        OpenLayers.Event.stop(evt, true);
    },

    /** If the drag was started within the popup, then 
     *   do not propagate the mousemove (but do so safely
     *   so that user can select text inside)
     * 
     * @param {Event} evt
     */
    onmousemove: function (evt) {
        if (this.mousedown) {
            OpenLayers.Event.stop(evt, true);
        }
    },

    /** When mouse comes up within the popup, after going down 
     *   in it, reset the flag, and then (once again) do not 
     *   propagate the event, but do so safely so that user can 
     *   select text inside
     * 
     * @param {Event} evt
     */
    onmouseup: function (evt) {
        if (this.mousedown) {
            this.mousedown = false;
            OpenLayers.Event.stop(evt, true);
        }
    },

    /** Ignore clicks, but allowing default browser handling
     * 
     * @param {Event} evt
     */
    onclick: function (evt) {
        OpenLayers.Event.stop(evt, true);
    },

    /** When mouse goes out of the popup set the flag to false so that
     *   if they let go and then drag back in, we won't be confused.
     * 
     * @param {Event} evt
     * 
     * @type Boolean
     */
    onmouseout: function (evt) {
        this.mousedown = false;
    },
    
    /** Ignore double-clicks, but allowing default browser handling
     * 
     * @param {Event} evt
     */
    ondblclick: function (evt) {
        OpenLayers.Event.stop(evt, true);
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Popup"
};
