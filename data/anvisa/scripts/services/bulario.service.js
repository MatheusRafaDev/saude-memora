angular.module('consultas').service('bularioService', ['Restangular', function(Restangular){
    this.api = function(){
        return Restangular.one('consulta/bulario');
    };

    this.find = function(filter, success, error){
        this.api().withHttpConfig({paramSerializer: '$httpParamSerializerJQLike'}).customGET('', filter).then(success, error);
    };
    this.detail = function(idProduto, filter, success, error){
        this.api().one(idProduto).withHttpConfig({paramSerializer: '$httpParamSerializerJQLike'}).customGET('', filter).then(success, error);
    };

}]);