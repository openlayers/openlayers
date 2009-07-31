/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/* Translators (2009 onwards):
 *  - Audun
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["no"]
 * Dictionary for ‪Norsk (bokmål)‬.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["no"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Uhåndterte forespørsler returnerer ${statusText}",

    'permalink': "Permalink",

    'overlays': "Overlappinger",

    'baseLayer': "Bakgrunnslag",

    'sameProjection': "Oversiktskartet virker bare når det har samme projeksjon som hovedkartet",

    'readNotImplemented': "Lesning er ikke implementert.",

    'writeNotImplemented': "Skriving er ikke implementert.",

    'noFID': "Kan ikke oppdatere et feature (et objekt) uten FID.",

    'errorLoadingGML': "Feil under lastning av GML-fil ${url}",

    'browserNotSupported': "Nettleseren din støtter ikke vektorvisning. Nåværende støttede visninger er:\n${renderers}",

    'componentShouldBe': "addFeatures: komponent burde være en ${geomType}",

    'getFeatureError': "getFeatureFromEvent har blitt kalt på i et lag uten en visning. Dette betyr som oftest at du har ødelagt et lag, men ikke noen håndterere som er tilknyttet med det.",

    'minZoomLevelError': "minZoomLevel egenskapen er bare ment til bruk med FixedZoomLevels-descendent-lag. At dette WFS-laget ser etter minZoomLevel er en etterlevning fra tidligere versjoner. Vi kan i midlertidig ikke fjerne den uten å risikere å ødelegge OpenLayers-baserte programmer som benytter seg av funksjonen. På grunn av dette fjerner vi den og minZoomLevel-sjekken nedenunder vil bli fjernet ved versjon 3.0. Vennligst bruk min/max resolusjonsinnstillinger som beskrevet her: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS-transaksjon: Lykkes ${response}",

    'commitFailed': "WFS-transaksjon: Mislykkes ${response}",

    'googleWarning': "Google-laget kunne ikke lastes korrekt.\x3cbr\x3e\x3cbr\x3eFor å fjerne denne meldingen, velg et nytt bakgrunnskart i lagvelgeren i det øvre høyre hjørnet.\x3cbr\x3e\x3cbr\x3eMest sansynnelig er dette fordi Google Maps-biblioteksskriptet enten ikke ble inkludert eller fordi det ikke inneholder riktig API-nøkkel for din side.\x3cbr\x3e\x3cbr\x3eUtviklere: Se \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3ewikien\x3c/a\x3e for hjelp til å få dette til å virke på riktig måte.",

    'getLayerWarning': "Laget ${layerType} kunne ikke lastet korrekt. \x3cbr\x3e\x3cbr\x3eFor å fjerne denne meldingen, velg et nytt bakgrunnskart i lagvelgeren i det øvre høyre hjørnet.\x3cbr\x3e\x3cbr\x3eMest sansynnelig er dette fordi ${layerLib} biblioteksskriptet ikke ble inkludert på riktig måte.\x3cbr\x3e\x3cbr\x3eUtviklere: Se \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3ewikien\x3c/a\x3e for hjelp til å få dette til å virke på riktig måte.",

    'scale': "Skala = 1 : ${scaleDenom}",

    'layerAlreadyAdded': "Du forsøkte å legge til laget ${layerName} til kartet, men det har allerede blitt lagt til",

    'reprojectDeprecated': "Du bruker innstillingen \'reproject\' på laget ${layerName}. Dette alternativet benyttes ikke lenger: det var beregnet for å støtte data over kommersielle bakgrunnskart, men funksjonaliteten bør nå oppnås ved bruk av Spherical Mercator støtten. Mer informasjon er tilgjengelig på http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Denne funksjonen er ikke lenger i bruk og vil bli fjernet i versjon 3.0. Vennligst bruk ${newMethod} istedenfor.",

    'boundsAddError': "Du må angi både x og y verdier til add-funksjonen.",

    'lonlatAddError': "Du må angi både lon og lat verdier til add-funksjonen.",

    'pixelAddError': "Du må angi både x og y verdier til add-funksjonen.",

    'unsupportedGeometryType': "Ikke støttet geometritype: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition feilet: elementet med id ${elemId} kan være feilplassert.",

    'filterEvaluateNotImplemented': "\'evaluate\' er ikke implementert for denne filtertypen."

});
