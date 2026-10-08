angular.module('consultas').service('hcaptchaService', ['$q', 'Restangular', function($q, Restangular) {

    // Endpoint do hCaptcha
    this.api = function() {
        return Restangular.one('validate'); // Caminho base
    };

    // Valida o hCaptcha
    this.validarCaptcha = function(token) {
        // Faz a requisição POST corretamente
        return this.api()
            .one('hcaptcha') // Endpoint: /validate/hcaptcha
            .customPOST({ 'h-captcha-response': token }) // Envia como POST
            .then(response => {
                return response; // Sucesso
            })
            .catch(error => {
                return $q.reject({
                    status: error.status || 500,
                    message: error.data || 'Erro ao validar o hCaptcha.'
                });
            });
    };
}]);
