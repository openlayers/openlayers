/* Translators (2009 onwards):
 *  - Luckas Blade
 *  - Rodrigo Avila
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["pt-br"]
 * Dictionary for Português do Brasil.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["pt-br"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "A requisição retornou um erro não tratado: ${statusText}",

    'Permalink': "Link para essa página",

    'Overlays': "Camadas de Sobreposição",

    'Base Layer': "Camada Base",

    'readNotImplemented': "Leitura não implementada.",

    'writeNotImplemented': "Escrita não implementada.",

    'noFID': "Não é possível atualizar uma feição que não tenha um FID.",

    'errorLoadingGML': "Erro ao carregar o arquivo GML ${url}",

    'browserNotSupported': "Seu navegador não suporta renderização de vetores. Os renderizadores suportados atualmente são:\n${renderers}",

    'componentShouldBe': "addFeatures: o componente deve ser do tipo ${geomType}",

    'getFeatureError': "getFeatureFromEvent foi executado mas nenhum renderizador foi encontrado. Isso pode indicar que você destruiu uma camana, mas não o handler associado a ela.",

    'minZoomLevelError': "A propriedade minZoomLevel é de uso restrito das camadas descendentes de FixedZoomLevels. A verificação dessa propriedade pelas camadas wfs é um resíduo do passado. Não podemos, entretanto não é possível removê-la sem possívelmente quebrar o funcionamento de aplicações OL que possuem depência com ela. Portanto estamos tornando seu uso obsoleto -- a verificação desse atributo será removida na versão 3.0. Ao invés, use as opções de resolução min/max como descrito em: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transação WFS : SUCESSO ${response}",

    'commitFailed': "Transação WFS : ERRO ${response}",

    'googleWarning': "Não foi possível carregar a camada Google corretamente.\x3cbr\x3e\x3cbr\x3ePara se livrar dessa mensagem, selecione uma nova Camada Base, na ferramenta de alternação de camadas localização do canto superior direito.\x3cbr\x3e\x3cbr\x3eMuito provavelmente, isso foi causado porque o script da biblioteca do Google Maps não foi incluído, ou porque ele não contém a chave correta da API para o seu site.\x3cbr\x3e\x3cbr\x3eDesenvolvedores: Para obter ajuda em solucionar esse problema \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3ecliquem aqui\x3c/a\x3e",

    'getLayerWarning': "Não foi possível carregar a camada ${layerType} corretamente.\x3cbr\x3e\x3cbr\x3ePara se livrar dessa mensagem, selecione uma nova Camada Base, na ferramenta de alternação de camadas localização do canto superior direito.\x3cbr\x3e\x3cbr\x3eMuito provavelmente, isso foi causado porque o script da biblioteca ${layerLib} não foi incluído corretamente.\x3cbr\x3e\x3cbr\x3eDesenvolvedores: Para obter ajuda em solucionar esse problema \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3ecliquem aqui\x3c/a\x3e",

    'Scale = 1 : ${scaleDenom}': "Escala = 1 : ${scaleDenom}",

    'W': "O",

    'E': "L",

    'N': "N",

    'S': "S",

    'layerAlreadyAdded': "Você tentou adicionar a camada: ${layerName} ao mapa, mas ela já foi adicionada",

    'reprojectDeprecated': "Você está usando a opção \'reproject\' na camada ${layerName}. Essa opção está obsoleta: seu uso foi projetado para suportar a visualização de dados sobre bases de mapas comerciais, entretanto essa funcionalidade deve agora ser alcançada usando o suporte à projeção Mercator. Mais informação está disponível em: http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Esse método está obsoleto e será removido na versão 3.0. Ao invés, por favor use ${newMethod}.",

    'boundsAddError': "Você deve informar ambos os valores x e y para a função add.",

    'lonlatAddError': "Você deve informar ambos os valores lon e lat para a função add.",

    'pixelAddError': "Você deve informar ambos os valores x e y para a função add.",

    'unsupportedGeometryType': "Tipo geométrico não suportado: ${geomType}.",

    'filterEvaluateNotImplemented': "evaluete não está implementado para este tipo de filtro."

});
