/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/* Translators (2009 onwards):
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["nb"]
 * Dictionary for ‪Norsk (bokmål)‬.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["nb"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Ubehandlet forespørsel returnerte ${statusText}",

    'permalink': "Kobling til denne siden",

    'overlays': "Kartlag",

    'baseLayer': "Bakgrunnskart",

    'sameProjection': "Oversiktskartet fungerer bare når det har samme projeksjon som hovedkartet",

    'readNotImplemented': "Lesing er ikke implementert.",

    'writeNotImplemented': "Skriving er ikke implementert.",

    'noFID': "Kan ikke oppdatere feature (objekt) som ikke har FID.",

    'errorLoadingGML': "Feil under lasting av GML-fil ${url}",

    'browserNotSupported': "Din nettleser støtter ikke vektortegning. Følgende tegnemetoder støttes:\n${renderers}",

    'componentShouldBe': "addFeatures : komponenten må være en ${geomType}",

    'getFeatureError': "getFeatureFromEvent kjørt mot lag uten tegnemetode. Dette betyr som regel at du fjernet et lag uten å fjerne alle handlere tilknyttet laget.",

    'minZoomLevelError': "Egenskapen minZoomLevel er kun tenkt for bruk på lag basert på FixedZoomLevels. At dette wfs-laget sjekker minZoomLevel er en fortidslevning. Det kan dog ikke tas bort uten å risikere at OL-baserte applikasjoner slutter å virke, så det er merket som foreldet: minZoomLevel i sjekken nedenfor vil fjernes i 3.0. Vennligst bruk innstillingene for min/maks oppløsning som er beskrevet her: \"+\n        \"http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS-transaksjon: SUKSESS ${response}",

    'commitFailed': "WFS-transaksjon: FEILET ${response}",

    'googleWarning': "Google-laget kunne ikke lastes.\x3cbr\x3e\x3cbr\x3eBytt til et annet bakgrunnslag i lagvelgeren i øvre høyre hjørne for å slippe denne meldingen.\x3cbr\x3e\x3cbr\x3eSannsynligvis forårsakes feilen av at Google Maps-biblioteket ikke er riktig inkludert på nettsiden, eller at det ikke er angitt riktig API-nøkkel for nettstedet.\x3cbr\x3e\x3cbr\x3eUtviklere: For hjelp til å få dette til å virke se \"+\n        \"\x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eher\x3c/a\x3e.",

    'getLayerWarning': "${layerType}-laget kunne ikke lastes.\x3cbr\x3e\x3cbr\x3eBytt til et annet bakgrunnslag i lagvelgeren i øvre høyre hjørne for å slippe denne meldingen.\x3cbr\x3e\x3cbr\x3eSannsynligvis forårsakes feilen av at ${layerLib}-biblioteket ikke var riktig inkludert på nettsiden.\x3cbr\x3e\x3cbr\x3eUtviklere: For hjelp til å få dette til å virke se \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eher\x3c/a\x3e.",

    'scale': "\x3cstrong\x3eSkala\x3c/strong\x3e 1 : ${scaleDenom}",

    'layerAlreadyAdded': "Du forsøkte å legge til laget ${layerName} på kartet, men det er allerede lagt til",

    'reprojectDeprecated': "Du bruker innstillingen \'reproject\' på laget ${layerName}. Denne innstillingen er foreldet, den var ment for å støtte visning av kartdata over kommersielle bakgrunnskart, men det bør nå gjøres med støtten for Spherical Mercator. Mer informasjon finnes på http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Denne metoden er markert som foreldet og vil bli fjernet i 3.0. Bruk ${newMethod} i stedet.",

    'boundsAddError': "Du må gi både x- og y-verdier til funksjonen add.",

    'lonlatAddError': "Du må gi både lon- og lat-verdier til funksjonen add.",

    'pixelAddError': "Du må gi både x- og y-verdier til funksjonen add.",

    'unsupportedGeometryType': "Ustøttet geometritype: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition feilet: elementet med id ${elemId} kan være feilplassert.",

};
