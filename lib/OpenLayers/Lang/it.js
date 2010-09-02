/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["it"]
 * Dictionary for Italian.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang.it = {

    'unhandledRequest': "Codice di ritorno della richiesta ${statusText}",

    'permalink': "Permalink",

    'overlays': "Overlays",

    'baseLayer': "Livello base",

    'sameProjection':
        "La mini mappa funziona solamente se ha la stessa proiezione della mappa principale",

    'readNotImplemented': "Lettura non implementata.",

    'writeNotImplemented': "Scrittura non implementata.",

    'noFID': "Impossibile aggiornare un elemento grafico che non abbia il FID.",

    'errorLoadingGML': "Errore nel caricamento del file GML ${url}",

    'browserNotSupported':
        "Il tuo browser non supporta il rendering vettoriale. I renderizzatore attualemnte supportati sono:\n${renderers}",

    'componentShouldBe': "addFeatures : il componente dovrebbe essere di tipo ${geomType}",

    // console message
    'getFeatureError':
        "getFeatureFromEvent chiamata su di un livello senza renderizzatore. Ciò significa che " +
        "il livello è stato cancellato, ma non i gestori associati ad esso.",

    // console message
    'minZoomLevelError':
        "La proprietà minZoomLevel è da utilizzare solamente " +
        "con livelli che abbiano FixedZoomLevels. Il fatto che " +
        "questo livello wfs controlli la proprietà minZoomLevel è " +
        "un retaggio del passato. Non possiamo comunque rimuoverla " +
        "senza rompere le vecchie applicazioni che dipendono su di essa." +
        "Quindi siamo costretti a deprecarla -- minZoomLevel " +
        "e sarà rimossa dalla vesione 3.0. Si prega di utilizzare i " +
        "settaggi di risoluzione min/max come descritto qui: " +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transazione WFS: SUCCESS ${response}",

    'commitFailed': "Transazione WFS: FAILED ${response}",

    'googleWarning':
        "Il livello Google non è riuscito a caricare correttamente.<br><br>" +
        "Per evitare questo messaggio, seleziona un nuovo BaseLayer " +
        "nel selettore di livelli nell'angolo in alto a destra.<br><br>" +
        "Più precisamente, ciò accade perchè la libreria Google Maps " +
        "non è stata inclusa nella pagina, oppure non contiene la " +
        "corretta API key per il tuo sito.<br><br>" +
        "Sviluppatori: Per aiuto su come farlo funzionare correttamente, " +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>clicca qui</a>",

    'getLayerWarning':
        "Il livello ${layerType} non è riuscito a caricare correttamente.<br><br>" +
        "Per evitare questo messaggio, seleziona un nuovo BaseLayer " +
        "nel selettore di livelli nell'angolo in alto a destra.<br><br>" +
        "Più precisamente, ciò accade perchè la libreria ${layerLib} " +
        "non è stata inclusa nella pagina.<br><br>" +
        "Sviluppatori: Per aiuto su come farlo funzionare correttamente, " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>clicca qui</a>",

    'scale': "Scala = 1 : ${scaleDenom}",

    // console message
    'layerAlreadyAdded':
        "Stai cercando di aggiungere il livello: ${layerName} alla mappa, ma tale livello è già stato aggiunto.",

    // console message
    'reprojectDeprecated':
        "Stai utilizzando l'opzione 'reproject' sul livello ${layerName}. " +
        "Questa opzione è deprecata: il suo utilizzo è stato introdotto per" +
        "supportare il disegno dei dati sopra mappe commerciali, ma tale " + 
        "funzionalità dovrebbe essere ottenuta tramite l'utilizzo della proiezione " +
        "Spherical Mercator. Per maggiori informazioni consultare qui " +
        "http://trac.openlayers.org/wiki/SphericalMercator.",

    // console message
    'methodDeprecated':
        "Questo metodo è stato deprecato e sarà rimosso dalla versione 3.0. " +
        "Si prega di utilizzare il metodo ${newMethod} in alternativa.",

    // console message
    'boundsAddError': "Devi specificare i valori di x e y alla funzione add.",

    // console message
    'lonlatAddError': "Devi specificare i valori di lon e lat alla funzione add.",

    // console message
    'pixelAddError': "Devi specificare i valori di x e y alla funzione add.",

    // console message
    'unsupportedGeometryType': "Tipo di geometria non supportata: ${geomType}",

    // console message
    'pagePositionFailed':
        "OpenLayers.Util.pagePosition fallita: l'elemento con id ${elemId} è posizionato in modo errato.",
                    
    'end': ''
};
