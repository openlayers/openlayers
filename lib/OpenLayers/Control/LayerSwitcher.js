/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/** 
 * @class
 * 
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Control.js
 */
OpenLayers.Control.LayerSwitcher = OpenLayers.Class.create();
OpenLayers.Control.LayerSwitcher.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control, {

    /** @type String */
    activeColor: "darkblue",
    

  // DOM Elements
  
    /** @type DOMElement */
    layersDiv: null,
    
    /** @type DOMElement */
    baseLayersDiv: null,

    /** @type Array */
    baseLayers: null,
    
    
    /** @type DOMElement */
    dataLbl: null,
    
    /** @type DOMElement */
    dataLayersDiv: null,

    /** @type Array */
    dataLayers: null,


    /** @type DOMElement */
    minimizeDiv: null,

    /** @type DOMElement */
    maximizeDiv: null,
    
    /** @type Boolean */
    ascending: true,
 
    /**
    * @constructor
    */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /**
     * 
     */    
    destroy: function() {
        
        OpenLayers.Event.stopObservingElement(this.div);

        OpenLayers.Event.stopObservingElement(this.minimizeDiv);
        OpenLayers.Event.stopObservingElement(this.maximizeDiv);

        //clear out layers info and unregister their events 
        this.clearLayersArray("base");
        this.clearLayersArray("data");
        
        this.map.events.unregister("addlayer", this, this.redraw);
        this.map.events.unregister("changelayer", this, this.redraw);
        this.map.events.unregister("removelayer", this, this.redraw);
        this.map.events.unregister("changebaselayer", this, this.redraw);
        
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
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

    /** user specifies either "base" or "data". we then clear all the 
     *    corresponding listeners, the div, and reinitialize a new array.
     * 
     * @private
     * 
     * @param {String} layersType Ei
     */
    clearLayersArray: function(layersType) {
        var layers = this[layersType + "Layers"];
        if (layers) {
            for(var i=0; i < layers.length; i++) {
                var layer = layers[i];
                OpenLayers.Event.stopObservingElement(layer.inputElem);
                OpenLayers.Event.stopObservingElement(layer.labelSpan);
            }
        }
        this[layersType + "LayersDiv"].innerHTML = "";
        this[layersType + "Layers"] = new Array();
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
        this.clearLayersArray("base");
        this.clearLayersArray("data");
        
        var containsOverlays = false;
        
        var layers = this.map.layers.slice();
        if (!this.ascending) { layers.reverse(); }
        for( var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            var baseLayer = layer.isBaseLayer;

            if (baseLayer || layer.displayInLayerSwitcher) {

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

                if (!baseLayer && !layer.inRange) {
                    inputElem.disabled = true;
                }
                var context = {
                    'inputElem': inputElem,
                    'layer': layer,
                    'layerSwitcher': this
                }
                OpenLayers.Event.observe(inputElem, "mouseup", 
                              this.onInputClick.bindAsEventListener(context));
                
                // create span
                var labelSpan = document.createElement("span");
                if (!baseLayer && !layer.inRange) {
                    labelSpan.style.color = "gray";
                }
                labelSpan.innerHTML = layer.name;
                labelSpan.style.verticalAlign = (baseLayer) ? "bottom" 
                                                            : "baseline";
                OpenLayers.Event.observe(labelSpan, "click", 
                              this.onInputClick.bindAsEventListener(context));
                // create line break
                var br = document.createElement("br");
    
                
                var groupArray = (baseLayer) ? this.baseLayers
                                             : this.dataLayers;
                groupArray.push({
                    'layer': layer,
                    'inputElem': inputElem,
                    'labelSpan': labelSpan
                });
                                                     
    
                var groupDiv = (baseLayer) ? this.baseLayersDiv
                                           : this.dataLayersDiv;
                groupDiv.appendChild(inputElem);
                groupDiv.appendChild(labelSpan);
                groupDiv.appendChild(br);
            }
        }

        // if no overlays, dont display the overlay label
        this.dataLbl.style.display = (containsOverlays) ? "" : "none";        

        return this.div;
    },

    /** A label has been clicked, check or uncheck its corresponding input
     * 
     * @private
     * 
     * @context 
     *      {DOMElement} inputElem
     *      {OpenLayers.Control.LayerSwitcher} layerSwitcher
     *      {OpenLayers.Layer} layer
     * 
     * @param {Event} e
     */

    onInputClick: function(e) {

        if (!this.inputElem.disabled) {
            if (this.inputElem.type == "radio") {
                this.inputElem.checked = true;
                this.layer.map.setBaseLayer(this.layer, true);
                this.layer.map.events.triggerEvent("changebaselayer");
            } else {
                this.inputElem.checked = !this.inputElem.checked;
                this.layerSwitcher.updateMap();
            }
        }
        OpenLayers.Event.stop(e);
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
        for(var i=0; i < this.baseLayers.length; i++) {
            var layerEntry = this.baseLayers[i];
            if (layerEntry.inputElem.checked) {
                this.map.setBaseLayer(layerEntry.layer, false);
            }
        }

        // set the correct visibilities for the overlays
        for(var i=0; i < this.dataLayers.length; i++) {
            var layerEntry = this.dataLayers[i];   
            layerEntry.layer.setVisibility(layerEntry.inputElem.checked, true);
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
            OpenLayers.Event.stop(e);                                            
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
            OpenLayers.Event.stop(e);                                            
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
    
        OpenLayers.Event.observe(this.div, "mouseup", 
                      this.mouseUp.bindAsEventListener(this));
        OpenLayers.Event.observe(this.div, "click",
                      this.ignoreEvent);
        OpenLayers.Event.observe(this.div, "mousedown",
                      this.mouseDown.bindAsEventListener(this));
        OpenLayers.Event.observe(this.div, "dblclick", this.ignoreEvent);


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
        
        this.baseLayersDiv = document.createElement("div");
        this.baseLayersDiv.style.paddingLeft = "10px";
        /*OpenLayers.Event.observe(this.baseLayersDiv, "click", 
                      this.onLayerClick.bindAsEventListener(this));
        */
                     

        this.dataLbl = document.createElement("div");
        this.dataLbl.innerHTML = "<u>Overlays</u>";
        this.dataLbl.style.marginTop = "3px";
        this.dataLbl.style.marginLeft = "3px";
        this.dataLbl.style.marginBottom = "3px";
        
        this.dataLayersDiv = document.createElement("div");
        this.dataLayersDiv.style.paddingLeft = "10px";

        if (this.ascending) {
            this.layersDiv.appendChild(baseLbl);
            this.layersDiv.appendChild(this.baseLayersDiv);
            this.layersDiv.appendChild(this.dataLbl);
            this.layersDiv.appendChild(this.dataLayersDiv);
        } else {
            this.layersDiv.appendChild(this.dataLbl);
            this.layersDiv.appendChild(this.dataLayersDiv);
            this.layersDiv.appendChild(baseLbl);
            this.layersDiv.appendChild(this.baseLayersDiv);
        }    
 
        this.div.appendChild(this.layersDiv);

        OpenLayers.Rico.Corner.round(this.div, {corners: "tl bl",
                                        bgColor: "transparent",
                                        color: this.activeColor,
                                        blend: false});

        OpenLayers.Rico.Corner.changeOpacity(this.layersDiv, 0.75);

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
        OpenLayers.Event.observe(this.maximizeDiv, 
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
        OpenLayers.Event.observe(this.minimizeDiv, 
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
        OpenLayers.Event.stop(evt);
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
