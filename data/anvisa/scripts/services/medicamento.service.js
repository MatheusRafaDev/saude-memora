/**
 * Created by mirante0 on 23/02/2016.
 */
angular.module('consultas').service('medicamentoService', ['Restangular', function(Restangular){
    let filterControl = {};

    this.setFilterControl = function( key, value ){
        filterControl[key] = value;
    }

    this.getFilterControl = function (){
        return filterControl;
    }

    this.clearFilterControl = function(){
        filterControl = {};
    }

    this.api = function(){
        return Restangular.one('consulta/medicamento');
    };

    this.find = function(filter, success, error){
        this.api().one('produtos/').withHttpConfig({paramSerializer: '$httpParamSerializerJQLike'}).customGET('', filter).then(success, error);
    };

    this.detail = function(codigoSeqProduto, codNotificacao, success, error){
        var codigo = codigoSeqProduto;
        if (codNotificacao != null){
            codigo += '?codigoNotificacao='+codNotificacao;
        }
        this.api().one('produtos/codigo/' + codigo ).get().then(success, error);
    };
    
    this.download  = function(filter, success, error){
        this.api().one('download')
        	.withHttpConfig({responseType: 'blob', paramSerializer: '$httpParamSerializerJQLike'})
        	.customGET('', filter).then(success, error);
    };
    
    this.findMedicamentosPpam = function(){
        return this.api().one('/produtos/ppam').getList().$object;
    };
 
    this.processoColen = function(numeroProcesso, success, error){
        this.api().one('processoColen/'  + numeroProcesso).get().then(success, error);
    };

}]);