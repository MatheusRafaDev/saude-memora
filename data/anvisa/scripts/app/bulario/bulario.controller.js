angular.module('consultas').config(['$stateProvider', function($stateProvider){
    $stateProvider.state('bulario', {
        parent: 'main',
        url:'bulario/?nomeProduto&numeroRegistro&codigoNotificacao&codigoMedicamento&tipoAnexo&expediente&substancia&categoriasRegulatorias&decisao&razaoSocial&cnpj&{periodoPublicacaoInicial:date}&{periodoPublicacaoFinal:date}',
        data:{
            displayName: 'Bulário Eletrônico'
        },
        views:{
            'content@':{
                templateUrl:'scripts/app/bulario/bulario.filtro.html',
                controller: ['$scope', '$state', '$stateParams','$filter','message', function($scope, $state, $stateParams,$filter,message){
                    $scope.filter = angular.extend({}, $stateParams);

                    function IsJsonString(item) {
                        item = typeof item !== "string"
                            ? JSON.stringify(item)
                            : item;

                        try {
                            item = JSON.parse(item);
                        } catch (e) {
                            return false;
                        }

                        if (typeof item === "object" && item !== null) {
                            return true;
                        }

                        return false;
                    }


                    $scope.numero_expediente = function(produto){
                        return produto.produto.tipo.codigo == 15 && produto.produto.numero_expediente ?
                            produto.produto.numero_expediente.replace(/^15/, '1') :
                            produto.produto.numero_expediente
                    };


                    $scope.consultar = function(){
                        if ($scope.filter.numeroRegistro && $scope.filter.numeroRegistro.length < 9) {
                            message({body: 'Número de registro inválido. Deve ser informado um número com 9 dígitos.', type:'warning'});
                            return;
                        }

                        if (($scope.filter.periodoPublicacaoInicial && !$scope.filter.periodoPublicacaoFinal) || 
                            (!$scope.filter.periodoPublicacaoInicial && $scope.filter.periodoPublicacaoFinal)) {
                            message({ body: 'Para filtrar por Período de Publicação, informe o período completo (Data inicial e final).', type: 'error' });
                            return;
                        }

                        if (($scope.filter.periodoPublicacaoInicial && $scope.filter.periodoPublicacaoFinal && 
                            $scope.filter.periodoPublicacaoInicial > $scope.filter.periodoPublicacaoFinal)) {
                            message({ body: 'mensagens.MSG-055', type: 'error' });
                            return;
                        }
                        
                        angular.forEach($scope.filter, function(value, key) {
                            if ((Array.isArray(value))
                                && (value.length > 0)) {
                                $scope.filter[key] = value.toString();
                            }
                        });

                        $state.go('bulario.result',
                            $scope.filter,
                            {inherit:false}
                        );
                    };

                    $scope.limpa = function(){

                        angular.forEach($scope.filter, function(value, key) {
                            if (Array.isArray(value)) {
                                $scope.filter[key] = [];
                            }else{
                                $scope.filter[key] = null;
                            }
                        });

                        $scope.$broadcast('inputEmpresa.clear');
                    };

                }]
            }
        }
    }).state('bulario.result', {
        parent: 'bulario',
        url:'q/',
        views:{
            'content@':{
                templateUrl:'scripts/app/bulario/bulario.result.html',
                controller: ['$scope', '$state', '$stateParams', 'tipoProduto', '$filter', 'bularioService', 'NgTableParamsAnvisa', 'message', '$loading','consultaService',
                    function($scope, $state, $stateParams, tipoProduto, $filter, bularioService, NgTableParamsAnvisa, message, $loading,consultaService){
                        $scope.tipoProduto = $filter('translate')('produtos.tipo.' + tipoProduto);

                        $scope.filter = angular.extend({}, $stateParams);
                        $scope.tipoAnexo = 5;
                        $scope.codigoNotificacao = $scope.filter.codigoNotificacao;

                        $scope.monitoramento = [];

                        $scope.detail = function(codproduto){

                            var url = $state.href(tipoProduto + '.detail', {codproduto:codproduto});
                            window.open(url,'_blank');
                        };

                        $scope.voltar = function(){
                            $state.go(tipoProduto, $scope.filter);
                        };

                        var filtros = ['nomeProduto','numeroRegistro', 'expediente', 'categoriasRegulatorias', 'cnpj', 'periodoPublicacaoInicial','periodoPublicacaoFinal'];

                        $scope.numeroRegistro = function(produto){
                            return produto.produto.tipo.codigo == 15 && produto.produto.numeroRegistro ?
                                produto.produto.numeroRegistro.replace(/^15/, '1') :
                                produto.produto.numeroRegistro
                        };

                        $scope.table = new NgTableParamsAnvisa(function($defer, params){
                            var found = false;
                            filtros.forEach(function(filtro){
                                if ($scope.filter[filtro]){
                                    found = true;
                                }
                            });

                            if (!found){
                                message({body:'mensagens.MSG-013', type:'error'});
                                $scope.voltar();
                                return;
                            }

                            $loading.start('content');
                            bularioService.find(angular.extend({}, params.parameters(), {filter: $scope.filter}), function(produtos){
                                $loading.finish('content');

                                if (!produtos.totalElements){
                                    message({body: 'mensagens.MSG-998', type:'warning'});
                                    $scope.voltar();
                                    return;
                                }
                                $scope.produtos = produtos.content;

                                params.total(produtos.totalElements);
                                $defer.resolve(produtos.content);
                            }, function(){
                                $loading.finish('content');
                            });
                        });

                        $scope.exportarExcel = function () {
                            $loading.start('content');
                            medicamentoService.download(angular.extend({}, null, {filter: $scope.filter}), function(produtos){
                                $loading.finish('content');

                                var file = new Blob([produtos], { type: 'application/vnd.ms-excel' });
                                saveAs(file, "consulta_medicamento.xls");

                            }, function(){
                                $loading.finish('content');
                            });

                        }

                        function isTipoProdutoMedicamento() {
                            return $scope.tipoProduto == 1;
                        }

                        function hasCnpj(pareceres) {
                            return pareceres.cpnj;
                        }

                        $scope.downloadBula = function(idBula) {
                            $loading.start('content');
                            consultaService.downloadBula(idBula, function(bula){
                                $loading.finish('content');
                                let date = new Date();
                                let currentTimeInMillis = date.getTime();
                                var file = new Blob([bula], { type: 'application/pdf' });
                                saveAs(file, "bula_"+currentTimeInMillis+".pdf");

                            }, function(){
                                $loading.finish('content');
                                message({type:'warning', body: "Recarregue a página para realizar o download"});
                                return;
                            });
                        };

                        $scope.downloadBulaNotifarmac = function(idBula, tipoAnexo) {
                            $loading.start('content');
                            consultaService.downloadBulaNotifarmac(idBula, tipoAnexo, function(bula){
                                $loading.finish('content');
                                let date = new Date();
                                let currentTimeInMillis = date.getTime();
                                var file = new Blob([bula], { type: 'application/pdf' });
                                saveAs(file, "bula_"+currentTimeInMillis+".pdf");

                            }, function(){
                                $loading.finish('content');
                                message({type:'error', body: "Erro inesperado"});
                                $scope.voltar();
                                return;
                            });
                        };
                    }]
            }
        },

        resolve: {
            tipoProduto: function(){
                return 'bulario';
            }
        }
    })


    // PÁGINA DE HISTÓRICO

        .state('bulario.detail', {
            parent: 'bulario',
            url: 'detalhe/:codproduto',
            data:{
                displayName: 'Detalhe da Bula do Produto'
            },
            views: {
                'content@': {
                    templateUrl: 'scripts/app/bulario/bulario.detail.html',
                    controller: ['$scope', '$filter', '$stateParams', '$loading', 'bularioService','NgTableParamsAnvisa','consultaService','message',
                        function ($scope, $filter, $stateParams, $loading, bularioService, NgTableParamsAnvisa,consultaService,message) {
                            $scope.Authorization = localStorage.getItem('Authorization');
                            $loading.start('content');
                            $scope.bula = {};
                            /*bularioService.detail($stateParams.codproduto, function(bula){
                                $loading.finish('content');
                                $scope.bula = bula;
                            }, function () {
                                $loading.finish('content');
                            });*/


                            $scope.table = new NgTableParamsAnvisa(function($defer, params){

                                $loading.start('content');
                                bularioService.detail($stateParams.codproduto, angular.extend({}, params.parameters(), {filter: $scope.filter}),
                                    function(bula){
                                    $loading.finish('content');
                                    $scope.bula = bula;
                                    params.total(bula.historico.totalElements);
                                    $defer.resolve(bula.historico.content);
                                }, function(){
                                    $loading.finish('content');
                                });

                                $scope.downloadBula = function(idBula) {
                                    $loading.start('content');
                                    consultaService.downloadBula(idBula, function(bula){
                                        $loading.finish('content');
                                        let date = new Date();
                                        let currentTimeInMillis = date.getTime();
                                        var file = new Blob([bula], { type: 'application/pdf' });
                                        saveAs(file, "bula_"+currentTimeInMillis+".pdf");

                                    }, function(){
                                        $loading.finish('content');
                                        message({type:'warning', body: "Recarregue a página para realizar o download"});
                                        return;
                                    });
                                };
                            });
                        }]
                }
            }
        });
}]);
