angular.module('consultas').service('autenticacaoApiService', ['$http', '$q', 'Restangular', function($http, $q, Restangular) {
    this.api = function() {
        return Restangular.one('authDocumento');
    };

 
    this.autenticar = function(filtro) {
        return this.api()
        .one('autenticar')
        .withHttpConfig({paramSerializer: '$httpParamSerializerJQLike'}).customGET('', filtro)
        .then(response => response)
        .catch(error => {
            return $q.reject({
                status: error.status || 500,
                message: error.data || 'Erro ao obter o arquivo.'
            });
        });
    };
    
}]);
