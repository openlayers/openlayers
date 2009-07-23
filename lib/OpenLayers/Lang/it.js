/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/* Translators (2009 onwards):
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["it"]
 * Dictionary for Italiano.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["it"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Codice di ritorno della richiesta ${statusText}",

    'permalink': "Permalink",

    'overlays': "Overlays",

    'baseLayer': "Livello base",

    'sameProjection': "La mini mappa funziona solamente se ha la stessa proiezione della mappa principale",

    'readNotImplemented': "Lettura non implementata.",

    'writeNotImplemented': "Scrittura non implementata.",

    'noFID': "Impossibile aggiornare un elemento grafico che non abbia il FID.",

    'errorLoadingGML': "Errore nel caricamento del file GML ${url}",

    'browserNotSupported': "Il tuo browser non supporta il rendering vettoriale. I renderizzatore attualemnte supportati sono:\n${renderers}",

    'componentShouldBe': "addFeatures : il componente dovrebbe essere di tipo ${geomType}",

    'getFeatureError': "getFeatureFromEvent chiamata su di un livello senza renderizzatore. Ciò significa che il livello è stato cancellato, ma non i gestori associati ad esso.",

    'minZoomLevelError': "La proprietà minZoomLevel è da utilizzare solamente con livelli che abbiano FixedZoomLevels. Il fatto che questo livello wfs controlli la proprietà minZoomLevel è un retaggio del passato. Non possiamo comunque rimuoverla senza rompere le vecchie applicazioni che dipendono su di essa.Quindi siamo costretti a deprecarla -- minZoomLevel e sarà rimossa dalla vesione 3.0. Si prega di utilizzare i settaggi di risoluzione min/max come descritto qui: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transazione WFS: SUCCESS ${response}",

    'commitFailed': "Transazione WFS: FAILED ${response}",

    'googleWarning': "Il livello Google non è riuscito a caricare correttamente.\x3cbr\x3e\x3cbr\x3ePer evitare questo messaggio, seleziona un nuovo BaseLayer nel selettore di livelli nell\'angolo in alto a destra.\x3cbr\x3e\x3cbr\x3ePiù precisamente, ciò accade perchè la libreria Google Maps non è stata inclusa nella pagina, oppure non contiene la corretta API key per il tuo sito.\x3cbr\x3e\x3cbr\x3eSviluppatori: Per aiuto su come farlo funzionare correttamente, \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eclicca qui\x3c/a\x3e",

    'getLayerWarning': "Il livello ${layerType} non è riuscito a caricare correttamente.\x3cbr\x3e\x3cbr\x3ePer evitare questo messaggio, seleziona un nuovo BaseLayer nel selettore di livelli nell\'angolo in alto a destra.\x3cbr\x3e\x3cbr\x3ePiù precisamente, ciò accade perchè la libreria ${layerLib} non è stata inclusa nella pagina.\x3cbr\x3e\x3cbr\x3eSviluppatori: Per aiuto su come farlo funzionare correttamente, \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eclicca qui\x3c/a\x3e",

    'scale': "Scala = 1 : ${scaleDenom}",

    'layerAlreadyAdded': "Stai cercando di aggiungere il livello: ${layerName} alla mappa, ma tale livello è già stato aggiunto.",

    'reprojectDeprecated': "Stai utilizzando l\'opzione \'reproject\' sul livello ${layerName}. Questa opzione è deprecata: il suo utilizzo è stato introdotto persupportare il disegno dei dati sopra mappe commerciali, ma tale funzionalità dovrebbe essere ottenuta tramite l\'utilizzo della proiezione Spherical Mercator. Per maggiori informazioni consultare qui http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Questo metodo è stato deprecato e sarà rimosso dalla versione 3.0. Si prega di utilizzare il metodo ${newMethod} in alternativa.",

    'boundsAddError': "Devi specificare i valori di x e y alla funzione add.",

    'lonlatAddError': "Devi specificare i valori di lon e lat alla funzione add.",

    'pixelAddError': "Devi specificare i valori di x e y alla funzione add.",

    'unsupportedGeometryType': "Tipo di geometria non supportata: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition fallita: l\'elemento con id ${elemId} è posizionato in modo errato.",

};
