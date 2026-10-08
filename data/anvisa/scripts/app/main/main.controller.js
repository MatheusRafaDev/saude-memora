angular.module('consultas').config(['$stateProvider', function($stateProvider){
    $stateProvider.state('main', {
        parent: 'site',
        url:'/',
        data:{
            displayName: 'Consultas'
        },
        views:{
            'content@':{
                templateUrl:'scripts/app/main/main.html',
                controller: ['$scope', '$loading', function($scope, $loading){
                    $loading.finish('content');

                    $scope.cosmeticos = {
                        title: 'Cosméticos',
                        controller: function(){},
                        templateUrl: 'scripts/app/main/options.cosmetico.html',
                        type: 'blank'
                    };

                    $scope.saneantes = {
                        title: 'Saneantes',
                        controller: function(){},
                        templateUrl: 'scripts/app/main/options.saneantes.html',
                        type: 'blank'
                    };
                    
                    $scope.funcionamento = {
                            title: 'Funcionamento de Empresa',
                            controller: function(){},
                            templateUrl: 'scripts/app/main/options.funcionamento.html',
                            type: 'blank'
                        };

                        $scope.manutencao = {
                            title: 'Página em manutenção',
                            controller: function(){},
                            templateUrl: 'scripts/app/main/manutencao.html',
                            type: 'blank'
                        };
                }]
            }
        }
    })
}]);