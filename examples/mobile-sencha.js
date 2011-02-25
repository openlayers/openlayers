Ext.ns('App');

/**
 * The model for the geonames records used in the search
 */
Ext.regModel('Geonames', {
    fields: ['countryName', 'toponymName', 'name', 'lat', 'lng']
});

/**
 * Custom class for the Search 
 */
App.SearchFormPopupPanel = Ext.extend(Ext.Panel, {
    map: null,
    floating: true,
    modal: true,
    centered: true,
    hideOnMaskTap: true,
    width: Ext.is.Phone ? undefined : 400,
    height: Ext.is.Phone ? undefined : 400,
    scroll: false,
    layout: 'fit',
    fullscreen: Ext.is.Phone ? true : undefined,
    url: 'http://ws.geonames.org/searchJSON?',
    errorText: 'Sorry, we had problems communicating with geonames.org. Please try again.',
    errorTitle: 'Communication error',
    maxResults: 6,
    featureClass: "P",
    
    createStore: function(){
        this.store = new Ext.data.Store({
            model: 'Geonames',
            proxy: {
                type: 'scripttag',
                timeout: 5000,
                listeners: {
                    exception: function(){
                        this.hide();
                        Ext.Msg.alert(this.errorTitle, this.errorText, Ext.emptyFn);
                    },
                    scope: this
                },
                url: this.url,
                reader: {
                    type: 'json',
                    root: 'geonames'
                }
            }
        });
    },
    
    doSearch: function(searchfield, evt){
        var q = searchfield.getValue();
        this.store.load({
            params: {
                featureClass: this.featureClass,
                maxRows: this.maxResults,
                name_startsWith: encodeURIComponent(q)
            }
        });
    },
    
    onItemTap: function(dataView, index, item, event){
        var record = this.store.getAt(index);
        var lon = record.get('lng');
        var lat = record.get('lat');
        var lonlat = new OpenLayers.LonLat(lon, lat);
        map.setCenter(lonlat.transform(gg, sm), 12);
        this.hide("pop");
    },
    
    initComponent: function(){
        this.createStore();
        this.resultList = new Ext.List({
            scroll: 'vertical',
            cls: 'searchList',
            loadingText: "Searching ...",
            store: this.store,
            itemTpl: '<div>{name} ({countryName})</div>',
            listeners: {
                itemtap: this.onItemTap,
                scope: this
            }
        });
        this.formContainer = new Ext.form.FormPanel({
            scroll: false,
            items: [{
                xtype: 'button',
                cls: 'close-btn',
                ui: 'decline-small',
                text: 'Close',
                handler: function(){
                    this.hide();
                },
                scope: this 
            }, {
                xtype: 'fieldset',
                scroll: false,
                title: 'Search for a place',
                items: [{
                    xtype: 'searchfield',
                    label: 'Search',
                    placeHolder: 'placename',
                    listeners: {
                        action: this.doSearch,
                        scope: this
                    }
                },
                    this.resultList
                ]
            }]
        });
        this.items = [{
            xtype: 'panel',
            layout: 'fit',
            items: [this.formContainer]
        }];
        App.SearchFormPopupPanel.superclass.initComponent.call(this);
    }
});

App.LayerList = Ext.extend(Ext.List, {
    
    map: null,
    
    createStore: function(){
        Ext.regModel('Layer', {
            fields: ['id', 'name', 'visibility', 'zindex']
        });
        var data = [];
        Ext.each(this.map.layers, function(layer){
            if (layer.displayInLayerSwitcher === true) {
                var visibility = layer.isBaseLayer ? (this.map.baseLayer == layer) : layer.getVisibility();
                data.push({
                    id: layer.id,
                    name: layer.name,
                    visibility: visibility,
                    zindex: layer.getZIndex()
                });
            }
        });
        return new Ext.data.Store({
            model: 'Layer',
            sorters: 'zindex',
            data: data
        });
    },
    
    initComponent: function(){
        this.store = this.createStore();
        this.itemTpl = new Ext.XTemplate(
            '<tpl if="visibility == true">', 
                '<img width="20" src="img/check-round-green.png">', 
            '</tpl>', 
            '<tpl if="visibility == false">', 
                '<img width="20" src="img/check-round-grey.png">', 
            '</tpl>', 
            '<span class="gx-layer-item">{name}</span>'
        );
        this.listeners = {
            itemtap: function(dataview, index, item, e){
                var record = dataview.getStore().getAt(index);
                var layer = this.map.getLayersBy("id", record.get("id"))[0];
                if (layer.isBaseLayer) {
                    this.map.setBaseLayer(layer);
                }
                else {
                    layer.setVisibility(!layer.getVisibility());
                }
                record.set("visibility", layer.getVisibility());
            }
        };
        this.map.events.on({
            "changelayer": this.onChangeLayer,
            scope: this
        });
        App.LayerList.superclass.initComponent.call(this);
    },

    findLayerRecord: function(layer){
        var found;
        this.store.each(function(record){
            if (record.get("id") === layer.id) {
                found = record;
            }
        }, this);
        return found;
    },
    
    onChangeLayer: function(evt){
        if (evt.property == "visibility") {
            var record = this.findLayerRecord(evt.layer);
            record.set("visibility", evt.layer.getVisibility());
        }
    }
    
});
Ext.reg('app_layerlist', App.LayerList);
