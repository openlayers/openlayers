/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["pt-BR"]
 * Dictionary for Brazilian Portuguese.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["pt-BR"] = {

    'unhandledRequest': "A requisição retornou um erro não tratado: ${statusText}",

    'permalink': "Link para essa página",

    'overlays': "Camadas de Sobreposição",

    'baseLayer': "Camada Base",

    'sameProjection':
        "O mapa de referência só funciona quando ele está na mesma projeção do mapa principal",

    'readNotImplemented': "Leitura não implementada.",

    'writeNotImplemented': "Escrita não implementada.",

    'noFID': "Não é possível atualizar uma feição que não tenha um FID.",

    'errorLoadingGML': "Erro ao carregar o arquivo GML ${url}",

    'browserNotSupported':
        "Seu navegador não suporta renderização de vetores. Os renderizadores suportados atualmente são:\n${renderers}",

    'componentShouldBe': "addFeatures: o componente deve ser do tipo ${geomType}",

    // console message
    'getFeatureError':
        "getFeatureFromEvent foi executado mas nenhum renderizador foi encontrado. " +
        "Isso pode indicar que você destruiu uma camana, mas não o handler associado a ela.",

    // console message
    'minZoomLevelError':
        "A propriedade minZoomLevel é de uso restrito das camadas "+
        "descendentes de FixedZoomLevels. A verificação dessa propriedade " +
        "pelas camadas wfs é um resíduo do passado. Não podemos, entretanto " +
        "não é possível removê-la sem possívelmente quebrar o funcionamento " +
        "de aplicações OL que possuem depência com ela. Portanto estamos " +
        "tornando seu uso obsoleto -- a verificação desse atributo será " +
        "removida na versão 3.0. Ao invés, use as opções de resolução " +
        "min/max como descrito em: " +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transação WFS : SUCESSO ${response}",

    'commitFailed': "Transação WFS : ERRO ${response}",

    'googleWarning':
        "Não foi possível carregar a camada Google corretamente.<br><br>" +
        "Para se livrar dessa mensagem, selecione uma nova Camada Base, " +
        "na ferramenta de alternação de camadas localização do canto " +
        "superior direito.<br><br>" +
        "Muito provavelmente, isso foi causado porque o script da " +
        "biblioteca do Google Maps não foi incluído, ou porque ele não " +
        "contém a chave correta da API para o seu site.<br><br>" +
        "Desenvolvedores: Para obter ajuda em solucionar esse problema " +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>cliquem aqui</a>",

    'getLayerWarning':
        "Não foi possível carregar a camada ${layerType} corretamente.<br><br>" +
        "Para se livrar dessa mensagem, selecione uma nova Camada Base, " +
        "na ferramenta de alternação de camadas localização do canto " +
        "superior direito.<br><br>" +
        "Muito provavelmente, isso foi causado porque o script da " +
        "biblioteca ${layerLib} não foi incluído corretamente.<br><br>" +
        "Desenvolvedores: Para obter ajuda em solucionar esse problema " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>cliquem aqui</a>",

    'scale': "Escala = 1 : ${scaleDenom}",

    // console message
    'layerAlreadyAdded':
        "Você tentou adicionar a camada: ${layerName} ao mapa, mas ela já foi adicionada",

    // console message
    'reprojectDeprecated':
        "Você está usando a opção 'reproject' na camada ${layerName}. " +
        "Essa opção está obsoleta: seu uso foi projetado para suportar " +
        "a visualização de dados sobre bases de mapas comerciais, " +
        "entretanto essa funcionalidade deve agora ser alcançada usando " +
        "o suporte à projeção Mercator. Mais informação está disponível em: " +
        "http://trac.openlayers.org/wiki/SphericalMercator.",

    // console message
    'methodDeprecated':
        "Esse método está obsoleto e será removido na versão 3.0. " +
        "Ao invés, por favor use ${newMethod}.",

    // console message
    'boundsAddError': "Você deve informar ambos os valores x e y para a função add.",

    // console message
    'lonlatAddError': "Você deve informar ambos os valores lon e lat para a função add.",

    // console message
    'pixelAddError': "Você deve informar ambos os valores x e y para a função add.",

    // console message
    'unsupportedGeometryType': "Tipo geométrico não suportado: ${geomType}.",

    // console message
    'pagePositionFailed':
        "OpenLayers.Util.pagePosition falhou: o elemento de id ${elemId} deve estar fora do lugar.",
                    
    'end': ''
};
