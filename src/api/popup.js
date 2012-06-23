goog.provide('ol.popup');

goog.require('ol.Popup');
goog.require('ol.map');


/**
 * @typedef {ol.Popup|Object} popup
 */
ol.PopupLike;



/**
 * @export
 * @param {ol.PopupLike} opt_arg popup object literal.
 * @return {ol.Popup} the popup.
 */
ol.popup = function(opt_arg){

    if (opt_arg instanceof ol.Popup) {
        return opt_arg;
    }
    
    /** @type {ol.Map} */
    var map;

    /** @type {ol.Loc|ol.Feature|undefined} */
    var anchor;

    /** @type {string|undefined} */
    var placement;

    /** @type {string|undefined} */
    var content;

    /** @type {string|undefined} */
    var template;

    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        if (goog.isObject(opt_arg)) {
            map = ol.API ? opt_arg['map'] : opt_arg.map;
            anchor = ol.API ? opt_arg['anchor'] : opt_arg.anchor;
            placement = ol.API ? opt_arg['placement'] : opt_arg.placement;
            content = ol.API ? opt_arg['content'] : opt_arg.content;
            template = ol.API ? opt_arg['template'] : opt_arg.template;
        }
    }

    var popup = new ol.Popup(map, anchor);
    
    if (goog.isDef(anchor)) {
        popup.setAnchor(anchor);
    }
    if (goog.isDef(placement)) {
        popup.setPlacement(placement);
    }
    if (goog.isDef(content)) {
        popup.setContent(content);
    }
    if (goog.isDef(template)) {
        popup.setTemplate(template);
    }
    
    return popup;
    
};


/**
 * @export
 * @param {ol.Loc|ol.Feature=} opt_arg a feature or a location.
 * @return {ol.Popup|ol.Feature|ol.Loc|undefined} Result.
 */
ol.Popup.prototype.anchor = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setAnchor(opt_arg);
        return this;
    }
    else {
        return this.getAnchor();
    }
};


/**
 * @export
 * @param {ol.Map=} opt_arg the map .
 * @return {ol.Popup|ol.Map|undefined} the map or the popup.
 */
ol.Popup.prototype.map = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setMap(opt_arg);
        return this;
    }
    else {
        return this.getMap();
    }
};

/**
 * @export
 * @param {string=} opt_arg the content for the map (HTML makrkup)
 * @return {ol.Popup|string|undefined} the content or the popup.
 */
ol.Popup.prototype.content = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setContent(opt_arg);
        return this;
    }
    else {
        return this.getContent();
    }
};

/**
 * @export
 * @param {string=} opt_arg the template to be used to generate the content
 * @return {ol.Popup|string|undefined} the template or the popup.
 */
ol.Popup.prototype.template = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        this.setTemplate(opt_arg);
        return this;
    }
    else {
        return this.getTemplate();
    }
};

/**
 * Open the popup.
 * @export
 * @param {ol.Feature|ol.Loc} opt_arg feature or location for the anchor
 */
ol.Popup.prototype.open = function(opt_arg) {
    this.doOpen(opt_arg);
};
