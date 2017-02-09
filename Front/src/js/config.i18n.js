(function () {
  'use strict';

  var i18n_en = {
    ok: 'Ok',
    save: 'Save',
    cancel: 'Cancel',
    operation: 'Operation',
    add: 'Add',
    edit: 'Edit',
    delete: 'Confirm Delete',
    warnDelete: 'Are you sure you want to delete this item? Note that this operation can not be undone!',
    picture: 'Picture',
    signin: 'Login',
    goBackHomePage: 'Home Page',
    signup: 'Sign up',
    campaign: 'Campaign',
    affiliateNetwork: 'AffiliateNetwork',
    affiliateNetworkName: 'Name',
    affiliateNetworkPostBackUrl: 'Url',
    dashBoard: 'DashBoard',
    trackCampaignName: 'Name',
    trackCampaignStatus: {
        0: 'Active',
        1: 'InActive'
    },
    offer: 'Offer',
    lander: 'Lander',
    flow: 'Flow',
    traffic: 'TrafficSource',
    trafficSourceStatus: {
      0: 'Active',
      1: 'InActive'
    },
    rule: 'Rule',
    fromDate: 'From',
    toDate: 'To',
    profile:'Profile',
    referralProgram:'ReferralProgram',
    subscriptions:'Subscriptions',
    domain:'Domain',
    setUp:'SetUp',
    userManagement:'UserManagement',
    botBlacklist:'BotBlacklist',
    invoices:'Invoices',
    eventLog:'EventLog',
    affiliate: 'AffiliateNetwork'
  };
  var i18n_zh = {
    ok: '确定',
    saving: '保存中',
    save: '保存',
    cancel: '取消',
    add: '添加',
    edit: '编辑',
    delete: '删除所选信息',
    warnDelete: '您确定要删除？请注意，此操作无法撤销！',
    signup: '注册',
    signin: '登录',
    goBackHomePage: '返回首页'
  };

  angular.module('app')
    .config(['$translateProvider', function ($translateProvider) {
      $translateProvider
        .translations('en', i18n_en)
        .translations('zh', i18n_zh);

      // Tell the module what language to use by default
      $translateProvider.preferredLanguage('en');

      // Enable escaping of HTML
      $translateProvider.useSanitizeValueStrategy('escape');
    }]);

})();
