angular
  .module('consultas')
  .constant('HCAPTCHA_SITE_KEY', window.__CONFIG__?.SITE_KEY || '');