

/** Parse a feature from an XML node
* MC specific at the moment
*/
OpenLayers.Feature = Class.create();
OpenLayers.Feature.prototype= {

    // Object
    listeners:null,

    // ol.Size
    size:null,
    
    // ol.LatLon
    _latlon:null,

    // str        
    id:"",
    fid:null,
    srsName:null,
    title:null,
    location:null,
    docurl:null,
    extract:null,
    geoExtract:null,
    relevance:null,
    geoRelevance:null,
    markerImage:null,

    initialize: function(fNode) {
        this.listeners = new Object();

        var docpt = OpenLayers.getNodes(fNode, "docpoint")[0];
        this.fid =  docpt.getAttribute('fid');
        this.id = this.fid;
    
        var node = OpenLayers.getNodes(docpt, "position")[0];
        node = OpenLayers.getNodes(node, "gml:Point")[0];
        this.srsName = node.getAttribute('srsName');
        var temp = OpenLayers.getTagText(node, "gml:coordinates");
        this._latlon = ol.LatLon.fromString(temp);
        
        this.title = OpenLayers.getTagText(docpt, "title");
        this.location = OpenLayers.getTagText(docpt, "locationName");
        this.docurl = OpenLayers.getTagText(docpt, "documentUrl");
        this.extract = OpenLayers.getTagText(docpt, "extract");
        this.geoExtract = OpenLayers.getTagText(docpt, "geoextract");
        this.relevance = OpenLayers.getTagText(docpt, "relevance");
        this.geoRelevance = OpenLayers.getTagText(docpt, "georelevance");
    
        this.markerImage = OpenLayers.getTagText(docpt, "markerImage");
        this.size = new ol.Size(20, 25); // TODO: Fix this hard coded value.
    },

    destroy: function() {
        this.listeners = null;
        this.fid = null;
        this.id = null;
        this.srsName = null;
        this._latlon = null;
        this.title = null;
        this.location = null;
        this.docurl = null;
        this.extract = null;
        this.geoExtract = null;
        this.relevance = null;
        this.geoRelevance = null;
        this.markerImage = null;
        this.size = null;
    },
    
    toString:function() {
        var s = this.title + " relevance:" + this.relevance + 
                    " [" + this.geoRelevance + "]";
        s += " Fid [" + this.fid + "] @ " + this._latlon.toString();
        s += " Location [" + this.geoExtract + "]";
        return s;
    },

    /* MARKER DATA INTERFACE FUNCTIONS:
    *
    *  getLatLon(), getImage() 
    *
    */
     
    /**
    * ret(ol.Point)
    */
    getLatLon:function() { return this._latlon.copyOf(); },


   /**
    * ret(ol.Point)
    */
    getImage:function() { return this.markerImage; },

 
    /** html content based on feature information
    *
	* ret(str): 
    */
    getContentHTML:function() {
    
        var contentHTML = "";
        
        contentHTML += "<div style='margin: 0.25em'>" 
        
        contentHTML += "<div style='height: 1.5em; overflow: hidden'>" 
        contentHTML += "<span style='font-size: 1.2em; font-weight: bold'>" 
        contentHTML +=     this.title;
        contentHTML += "</span>"
        contentHTML += "</div>"
        contentHTML += "<br/>"


        contentHTML += "<span style='font-size: 0.7em;'>" 
        contentHTML += "<b>Location:</b>";
        contentHTML += this.location;
        contentHTML += " (" + this.geoRelevance + ")";
        contentHTML += "</span>"
        contentHTML += "<br>"; 
        contentHTML += "<br/>"

        contentHTML += "<span style='font-size: 0.7em; align:center'>" 
        contentHTML += "<b>Extract:</b>";
        contentHTML += "</span>"
        contentHTML += "<br>"; 
        contentHTML += "<span style='font-size: 0.7em; align:center'>" 
        contentHTML += this.extract;
        contentHTML += "</span>"

        contentHTML += "</div>"

        return contentHTML;
    },

    /** html content based on feature information
    *
	* ret(str): 
    */
    getDivListHTML:function() {
    
        var divHTML = '';
      
        divHTML += '<div id="' + this.fid + '">';
        divHTML += '<a href="' + this.docurl + '">';
        divHTML +=     this.title;
        divHTML += '</a><div>';
        divHTML += this.extract;
        divHTML += '</div></div>';

        return divHTML;
    },

    /////////////////////////////////
    who:function(){return ("Feature.js");}  //last
    
};

/**
* @param {Array} nodes
* @param {str} tagName
*
* @return {Array}
*/
OpenLayers._getNodes=function(nodes, tagName) {
    var retArray = new Array();
    for (var i=0;i<nodes.length;i++) {
        if (nodes[i].nodeName==tagName) {
            retArray.push(nodes[i]);
        }
    }

    return retArray;
};

/** These could/should be made namespace aware?
*
* @param {} p
* @param {str} tagName
*
* @return {Array}
*/
OpenLayers.getNodes=function(p, tagName) {
    var nodes = Try.these(
        function () {
            return OpenLayers._getNodes(p.documentElement.childNodes,
                                            tagName);
        },
        function () {
            return OpenLayers._getNodes(p.childNodes, tagName);
        }
    );
    return nodes;
};

/**
* @param {} parent
* @param {str} item
* @param {int} index
*
* @return {str}
*/
OpenLayers.getTagText = function (parent, item, index) {
    var result = OpenLayers.getNodes(parent, item);
    if (result && (result.length > 0))
    {
        if (!index) {
            index=0;
        }
        if (result[index].childNodes.length > 1) {
            return result.childNodes[1].nodeValue; 
        }
        else if (result[index].childNodes.length == 1) {
            return result[index].firstChild.nodeValue; 
        }
    } else { 
        return ""; 
    }
};

