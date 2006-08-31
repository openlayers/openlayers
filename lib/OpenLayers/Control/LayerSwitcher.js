/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/** 
 * @class
 * 
 * @requires OpenLayers/Control.js
 */
OpenLayers.Control.LayerSwitcher = Class.create();
OpenLayers.Control.LayerSwitcher.prototype = 
  Object.extend( new OpenLayers.Control(), {

    /** For div.id
     * @type String */
    id:  "LayerSwitcher",

    /** @type String */
    activeColor: "darkblue",
    

  // DOM Elements
  
    /** @type DOMElement */
    layersDiv: null,
    
    /** @type DOMElement */
    baseLayersDiv: null,

    /** @type Array */
    baseLayerInputs: null,
    
    
    /** @type DOMElement */
    dataLbl: null,
    
    /** @type DOMElement */
    dataLayersDiv: null,

    /** @type Array */
    dataLayerInputs: null,


    /** @type DOMElement */
    minimizeDiv: null,

    /** @type DOMElement */
    maximizeDiv: null,
    
    /**
    * @constructor
    */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /** 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);

        this.map.events.register("addlayer", this, this.redraw);
        this.map.events.register("changelayer", this, this.redraw);
        this.map.events.register("removelayer", this, this.redraw);
        this.map.events.register("changebaselayer", this, this.redraw);
    },

    /**
    * @returns A reference to the DIV DOMElement containing the switcher tabs
    * @type DOMElement
    */  
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this);

        // create layout divs
        this.loadContents();

        // set mode to minimize
        this.minimizeControl();
        
        // populate div with current info
        this.redraw();    

        return this.div;
    },

    /** Goes through and takes the current state of the Map and rebuilds the
     *   control to display that state. Groups base layers into a radio-button
     *   group and lists each data layer with a checkbox.
     * 
     * @returns A reference to the DIV DOMElement containing the control
     * @type DOMElement
     */  
    redraw: function() {

        //clear out previous layers 
        this.baseLayersDiv.innerHTML = "";
        this.baseLayerInputs = new Array();
        
        this.dataLayersDiv.innerHTML = "";
        this.dataLayerInputs = new Array();
        
        var containsOverlays = false;
        
        for( var i = 0; i < this.map.layers.length; i++) {
            var layer = this.map.layers[i];
            var baseLayer = layer.isBaseLayer;

            if (!baseLayer) {
                containsOverlays = true;
            }

            // only check a baselayer if it is *the* baselayer, check data
            //  layers if they are visible
            var checked = (baseLayer) ? (layer == this.map.baseLayer)
                                      : layer.getVisibility();

            // create input element
            var inputElem = document.createElement("input");
            inputElem.id = "input_" + layer.name;
            inputElem.name = (baseLayer) ? "baseLayers" : layer.name;
            inputElem.type = (baseLayer) ? "radio" : "checkbox";
            inputElem.value = layer.name;
            inputElem.checked = checked;
            inputElem.defaultChecked = checked;
            inputElem.layer = layer;
            inputElem.control = this;
            Event.observe(inputElem, "mouseup", 
                          this.onInputClick.bindAsEventListener(inputElem));
            
            // create span
            var labelSpan = document.createElement("span");
            labelSpan.innerHTML = layer.name;
            labelSpan.style.verticalAlign = (baseLayer) ? "bottom" : "baseline";
            Event.observe(labelSpan, "click", 
                          this.onInputClick.bindAsEventListener(inputElem));
            // create line break
            var br = document.createElement("br");

            
            var groupArray = (baseLayer) ? this.baseLayerInputs
                                         : this.dataLayerInputs;
            groupArray.push(inputElem);
                                                 

            var groupDiv = (baseLayer) ? this.baseLayersDiv
                                       : this.dataLayersDiv;
            groupDiv.appendChild(inputElem);
            groupDiv.appendChild(labelSpan);
            groupDiv.appendChild(br);

        }

        // if no overlays, dont display the overlay label
        this.dataLbl.style.display = (containsOverlays) ? "" : "none";        

        return this.div;
    },

    /** A label has been clicked, check or uncheck its corresponding input
     * 
     * @private
     * 
     * @param {Event} e
     */

    onInputClick: function(e) {
        if (this.type == "radio") {
            this.checked = true;
            this.layer.map.setBaseLayer(this.layer, true);
            this.layer.map.events.triggerEvent("changebaselayer");
        } else {
            this.checked = !this.checked;
            this.control.updateMap();
        }
        Event.stop(e);
    },
    
    /** Need to update the map accordingly whenever user clicks in either of
     *   the layers.
     * 
     * @private
     * 
     * @param {Event} e
     */
    onLayerClick: function(e) {
        this.updateMap();
    },


    /** Cycles through the loaded data and base layer input arrays and makes
     *   the necessary calls to the Map object such that that the map's 
     *   visual state corresponds to what the user has selected in the control
     * 
     * @private
     */
    updateMap: function() {

        // set the newly selected base layer        
        for(var i=0; i < this.baseLayerInputs.length; i++) {
            var input = this.baseLayerInputs[i];   
            if (input.checked) {
                this.map.setBaseLayer(input.layer, false);
            }
        }

        // set the correct visibilities for the overlays
        for(var i=0; i < this.dataLayerInputs.length; i++) {
            var input = this.dataLayerInputs[i];   
            input.layer.setVisibility(input.checked, true);
        }

    },

    /** Set up the labels and divs for the control
     * 
     * @param {Event} e
     */
    maximizeControl: function(e) {

        //HACK HACK HACK - find a way to auto-size this layerswitcher
        this.div.style.width = "20em";
        this.div.style.height = "";

        this.showControls(false);

        if (e != null) {
            Event.stop(e);                                            
        }
    },
    
    /** Hide all the contents of the control, shrink the size, 
     *   add the maximize icon
     * 
     * @param {Event} e
     */
    minimizeControl: function(e) {

        this.div.style.width = "0px";
        this.div.style.height = "0px";

        this.showControls(true);

        if (e != null) {
            Event.stop(e);                                            
        }
    },

    /** Hide/Show all LayerSwitcher controls depending on whether we are
     *   minimized or not
     * 
     * @private
     * 
     * @param {Boolean} minimize
     */
    showControls: function(minimize) {

        this.maximizeDiv.style.display = minimize ? "" : "none";
        this.minimizeDiv.style.display = minimize ? "none" : "";

        this.layersDiv.style.display = minimize ? "none" : "";
    },
    
    /** Set up the labels and divs for the control
     * 
     */
    loadContents: function() {

        //configure main div
        this.div.style.position = "absolute";
        this.div.style.top = "10px";
        this.div.style.right = "0px";
        this.div.style.left = "";
        this.div.style.fontFamily = "sans-serif";
        this.div.style.fontWeight = "bold";
        this.div.style.marginTop = "3px";
        this.div.style.marginLeft = "3px";
        this.div.style.marginBottom = "3px";
        this.div.style.fontSize = "smaller";   
        this.div.style.color = "white";   
        this.div.style.backgroundColor = "transparent";
    
        Event.observe(this.div, "mouseup", 
                      this.mouseUp.bindAsEventListener(this));
        Event.observe(this.div, "click",
                      this.ignoreEvent);
        Event.observe(this.div, "mousedown",
                      this.mouseDown.bindAsEventListener(this));
        Event.observe(this.div, "dblclick", this.ignoreEvent);


        // layers list div        
        this.layersDiv = document.createElement("div");
        this.layersDiv.id = "layersDiv";
        this.layersDiv.style.paddingTop = "5px";
        this.layersDiv.style.paddingLeft = "10px";
        this.layersDiv.style.paddingBottom = "5px";
        this.layersDiv.style.paddingRight = "75px";
        this.layersDiv.style.backgroundColor = this.activeColor;        

        // had to set width/height to get transparency in IE to work.
        // thanks -- http://jszen.blogspot.com/2005/04/ie6-opacity-filter-caveat.html
        //
        this.layersDiv.style.width = "100%";
        this.layersDiv.style.height = "100%";


        var baseLbl = document.createElement("div");
        baseLbl.innerHTML = "<u>Base Layer</u>";
        baseLbl.style.marginTop = "3px";
        baseLbl.style.marginLeft = "3px";
        baseLbl.style.marginBottom = "3px";
        this.layersDiv.appendChild(baseLbl);
        
        this.baseLayersDiv = document.createElement("div");
        this.baseLayersDiv.style.paddingLeft = "10px";
        /*Event.observe(this.baseLayersDiv, "click", 
                      this.onLayerClick.bindAsEventListener(this));
        */
        this.layersDiv.appendChild(this.baseLayersDiv);
                     

        this.dataLbl = document.createElement("div");
        this.dataLbl.innerHTML = "<u>Overlays</u>";
        this.dataLbl.style.marginTop = "3px";
        this.dataLbl.style.marginLeft = "3px";
        this.dataLbl.style.marginBottom = "3px";
        this.layersDiv.appendChild(this.dataLbl);
        
        this.dataLayersDiv = document.createElement("div");
        this.dataLayersDiv.style.paddingLeft = "10px";
        /*Event.observe(this.dataLayersDiv, "click", 
                      this.onLayerClick.bindAsEventListener(this));
        */
        this.layersDiv.appendChild(this.dataLayersDiv);

        this.div.appendChild(this.layersDiv);

        Rico.Corner.round(this.div, {corners: "tl bl",
                                      bgColor: "transparent",
                                      color: this.activeColor,
                                      blend: false});

        Rico.Corner.changeOpacity(this.layersDiv, 0.75);

        var imgLocation = OpenLayers.Util.getImagesLocation();
        var sz = new OpenLayers.Size(18,18);        

        // maximize button div
        var img = imgLocation + 'layer-switcher-maximize.png';
        this.maximizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MaximizeDiv", 
                                    null, 
                                    sz, 
                                    img, 
                                    "absolute");
        this.maximizeDiv.style.top = "5px";
        this.maximizeDiv.style.right = "0px";
        this.maximizeDiv.style.left = "";
        this.maximizeDiv.style.display = "none";
        Event.observe(this.maximizeDiv, 
                      "click", 
                      this.maximizeControl.bindAsEventListener(this));
        
        this.div.appendChild(this.maximizeDiv);

        // minimize button div
        var img = imgLocation + 'layer-switcher-minimize.png';
        var sz = new OpenLayers.Size(18,18);        
        this.minimizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MinimizeDiv", 
                                    null, 
                                    sz, 
                                    img, 
                                    "absolute");
        this.minimizeDiv.style.top = "5px";
        this.minimizeDiv.style.right = "0px";
        this.minimizeDiv.style.left = "";
        this.minimizeDiv.style.display = "none";
        Event.observe(this.minimizeDiv, 
                      "click", 
                      this.minimizeControl.bindAsEventListener(this));

        this.div.appendChild(this.minimizeDiv);
    },
    
    /** 
     * @private
     *
     * @param {Event} evt
     */
    ignoreEvent: function(evt) {
        Event.stop(evt);
    },

    /** Register a local 'mouseDown' flag so that we'll know whether or not
     *   to ignore a mouseUp event
     * 
     * @private
     *
     * @param {Event} evt
     */
    mouseDown: function(evt) {
        this.mouseDown = true;
        this.ignoreEvent(evt);
    },

    /** If the 'mouseDown' flag has been set, that means that the drag was 
     *   started from within the LayerSwitcher control, and thus we can 
     *   ignore the mouseup. Otherwise, let the Event continue.
     *  
     * @private
     *
     * @param {Event} evt
     */
    mouseUp: function(evt) {
        if (this.mouseDown) {
            this.mouseDown = false;
            this.ignoreEvent(evt);
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.LayerSwitcher"
});
