/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["nb"]
 * Dictionary for norwegian bokmål (Norway). Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["nb"] = {

    'unhandledRequest': "Ubehandlet forespørsel returnerte ${statusText}",

    'permalink': "Kobling til denne siden",

    'overlays': "Kartlag",

    'baseLayer': "Bakgrunnskart",

    'sameProjection':
        "Oversiktskartet fungerer bare når det har samme projeksjon som hovedkartet",

    'readNotImplemented': "Lesing er ikke implementert.",

    'writeNotImplemented': "Skriving er ikke implementert.",

    'noFID': "Kan ikke oppdatere feature (objekt) som ikke har FID.",

    'errorLoadingGML': "Feil under lasting av GML-fil ${url}",

    'browserNotSupported':
        "Din nettleser støtter ikke vektortegning. Følgende tegnemetoder støttes:\n${renderers}",

    'componentShouldBe': "addFeatures : komponenten må være en ${geomType}",

    // console message
    'getFeatureError':
        "getFeatureFromEvent kjørt mot lag uten tegnemetode. Dette betyr som regel at du " +
        "fjernet et lag uten å fjerne alle handlere tilknyttet laget.",

    // console message
    'minZoomLevelError':
        "Egenskapen minZoomLevel er kun tenkt for bruk på lag " +
        "basert på FixedZoomLevels. At dette wfs-laget sjekker " +
        "minZoomLevel er en fortidslevning. Det kan dog ikke " +
        "tas bort uten å risikere at OL-baserte applikasjoner " +
        "slutter å virke, så det er merket som foreldet: " +
        "minZoomLevel i sjekken nedenfor vil fjernes i 3.0. " +
        "Vennligst bruk innstillingene for min/maks oppløsning " +
        "som er beskrevet her: "+
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS-transaksjon: SUKSESS ${response}",

    'commitFailed': "WFS-transaksjon: FEILET ${response}",

    'googleWarning':
        "Google-laget kunne ikke lastes.<br><br>" +
        "Bytt til et annet bakgrunnslag i lagvelgeren i " +
        "øvre høyre hjørne for å slippe denne meldingen.<br><br>" +
        "Sannsynligvis forårsakes feilen av at Google Maps-biblioteket " +
        "ikke er riktig inkludert på nettsiden, eller at det ikke er " +
        "angitt riktig API-nøkkel for nettstedet.<br><br>" +
        "Utviklere: For hjelp til å få dette til å virke se "+
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>her</a>.",

    'getLayerWarning':
        "${layerType}-laget kunne ikke lastes.<br><br>" +
        "Bytt til et annet bakgrunnslag i lagvelgeren i " +
        "øvre høyre hjørne for å slippe denne meldingen.<br><br>" +
        "Sannsynligvis forårsakes feilen av at " +
        "${layerLib}-biblioteket ikke var riktig inkludert " +
        "på nettsiden.<br><br>" +
        "Utviklere: For hjelp til å få dette til å virke se " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>her</a>.",

    'scale': "<strong>Skala</strong> 1 : ${scaleDenom}",

    // console message
    'layerAlreadyAdded':
        "Du forsøkte å legge til laget ${layerName} på kartet, men det er allerede lagt til",

    // console message
    'reprojectDeprecated':
        "Du bruker innstillingen 'reproject' på laget ${layerName}. " +
        "Denne innstillingen er foreldet, den var ment for å støtte " +
        "visning av kartdata over kommersielle bakgrunnskart, men det " +
        "bør nå gjøres med støtten for Spherical Mercator. Mer informasjon " +
        "finnes på http://trac.openlayers.org/wiki/SphericalMercator.",

    // console message
    'methodDeprecated':
        "Denne metoden er markert som foreldet og vil bli fjernet i 3.0. " +
        "Bruk ${newMethod} i stedet.",

    // console message
    'boundsAddError': "Du må gi både x- og y-verdier til funksjonen add.",

    // console message
    'lonlatAddError': "Du må gi både lon- og lat-verdier til funksjonen add.",

    // console message
    'pixelAddError': "Du må gi både x- og y-verdier til funksjonen add.",

    // console message
    'unsupportedGeometryType': "Ustøttet geometritype: ${geomType}",

    // console message
    'pagePositionFailed':
        "OpenLayers.Util.pagePosition feilet: elementet med id ${elemId} kan være feilplassert.",
                    
    'end': ''
};
