(function() {
  'use strict';

  angular.module('app').controller('TsreportCtrl', ['$scope', '$timeout', '$q', 'TemplateTrafficSource', 'ThirdPartyTrafficSource', 'Profile', 'DateRangeUtil', '$mdDialog', 'TrafficSourceSyncTask', 'TrafficSourceStatis', '$moment', TsreportCtrl])
  .directive('resizetsr',['$timeout','$q', '$window', function($timeout, $q, $window){
    return function(scope, element) {
      var timeout;
      var w_h = $(window);
      var nav_h = $('nav');
      var filter_h = $('.cs-action-bar-bg');
      var page_h = $('md-table-pagination');
      function getHeight() {
        var deferred = $q.defer();
        $timeout(function() {
          deferred.resolve({
            'w_h': w_h.height(),
            'nav_h': nav_h.height(),
            'filter_h':filter_h.outerHeight(true),
            'page_h':page_h.height()
          });
        });
        return deferred.promise;
      }

      function heightResize() {
        getHeight().then(function(newVal) {
          scope.windowHeight = newVal.w_h;
          scope.navHeight = newVal.nav_h;
          scope.filterHeight = newVal.filter_h;
          scope.pageHeight = newVal.page_h;

          angular.element(element).css({
            'height': (scope.windowHeight - 46 - scope.navHeight - scope.filterHeight - 56 - 33 - 5 - $('.breadcrumb-div').outerHeight(true)) + 'px'
          })
        })
      }
      heightResize();
      $(window).on('resize', function() {
        heightResize();
      });
    }
  }]);

  function TsreportCtrl($scope, $timeout, $q, TemplateTrafficSource, ThirdPartyTrafficSource, Profile, DateRangeUtil, $mdDialog, TrafficSourceSyncTask, TrafficSourceStatis, $moment) {
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.$q = $q;
    this.TemplateTrafficSource = TemplateTrafficSource;
    this.ThirdPartyTrafficSource = ThirdPartyTrafficSource;
    this.Profile = Profile;
    this.DateRangeUtil = DateRangeUtil;
    this.$mdDialog = $mdDialog;
    this.TrafficSourceSyncTask = TrafficSourceSyncTask;
    this.TrafficSourceStatis = TrafficSourceStatis;
    this.$moment = $moment;

    $scope.tsReportLimit = $scope.permissions.report.tsReport.tsReportLimit;

    this.templateTrafficSourceMap = {};
    this.thirdPartyTrafficSourceMap = {};
    this.timezoneMap = {};
    this.pageStatus = {};

    this.$scope.datetype = '1';
    this.$scope.fromDate = this.$scope.fromDate || moment().format('YYYY-MM-DD');
    this.$scope.fromTime = this.$scope.fromTime || '00:00';
    this.$scope.toDate = this.$scope.toDate || moment().add(1, 'days').format('YYYY-MM-DD');
    this.maxDate = this.$scope.toDate;
    this.$scope.toTime = this.$scope.toTime || '00:00';
    this.$scope.hours = (function() {
      var hours = [];
      for (var i = 0; i < 24; ++i) {
        if (i < 10) {
          hours.push('0' + i + ':00');
        } else {
          hours.push('' + i + ':00');
        }
      }
      return hours;
    })();

    $scope.datatypes = [
      {value: "1", display: "Today"},
      {value: "2", display: "Yesterday"},
      {value: "3", display: "Last 7 days"},
      {value: "4", display: "Last 14 days"},
      {value: "5", display: "This Week"},
      {value: "6", display: "Last Week"},
      {value: "7", display: "This Month"},
      {value: "8", display: "Last Month"},
      {value: "9", display: "This Year"},
      {value: "10", display: "Last Year"},
      {value: "0", display: "Custom"},
    ];

    $scope.datetypeFilter = this._filterDateType(0);

    $scope.fromDateOptions = {
      minDate: $scope.fromDate,
      maxDate: $scope.toDate
    }
    $scope.toDateOptions = {
      minDate: $scope.fromDate,
      maxDate: this.maxDate
    }

    this.$scope.query = {
      page: 1,
      limit: 50,
      order: 'click',
      __tk: 0
    };

    this.$scope.groupBy = '';
    this.$scope.groupBys = [];

    this.$scope.taskProgress = {};
    this.$scope.app.subtitle = 'tsReport';
    this.init();
    this.initEvent();
  }

  TsreportCtrl.prototype.init = function() {
    var self = this, initPromises = [];

    initPromises.push(self._getTemplateTrafficSource());
    initPromises.push(self._getThirdPartyTrafficSource());
    initPromises.push(self._getProfile());

    self.$q.all(initPromises).then(initSuccess);

    function initSuccess() {
      self.$scope.templateTrafficSources.forEach(function(data) {
        self.templateTrafficSourceMap[data.id] = data;
      });
      self.$scope.thirdPartyTrafficSources.forEach(function(data) {
        self.thirdPartyTrafficSourceMap[data.id] = data;
      });
      var thirdPartyTrafficSources = self.$scope.thirdPartyTrafficSources;
      if(thirdPartyTrafficSources.length > 0) {
        self.$scope.thirdPartyTrafficSourceId = thirdPartyTrafficSources[0].id;
        self.setFilter(thirdPartyTrafficSources[0].trustedTrafficSourceId);
        self.checkTrafficSourceTask.call(self, thirdPartyTrafficSources[0].id);
      }
    }
  };

  TsreportCtrl.prototype.initEvent = function() {
    var self = this, $scope = this.$scope;

    $scope.load = function($event) {
      $scope.groupBy = 'campaignId';
      $scope.campaignId = '';
      $scope.campaignName = '';
      self.getDateRange($scope.datetype);
      var params = {}, timezone = self.timezoneMap[$scope.timezoneId];
      angular.extend(params, self.pageStatus, {
        tsId: $scope.thirdPartyTrafficSourceId,
        meshSize: $scope.meshSizeId,
        tzShift: timezone.shift,
        tzParam: timezone.param,
        tzId: timezone.id
      });

      $scope.report = {rows: [], totalRows: 0};
      $scope.taskProgress[$scope.thirdPartyTrafficSourceId] = {
        offerStatus: false,
        progressStatus: true
      };
      self.TrafficSourceSyncTask.save(params, function(oData) {
        if(oData.status == 1) {
          $scope.taskId = oData.data.taskId;
          self.checkTrafficSourceTask($scope.thirdPartyTrafficSourceId);
        }
      });
    };

    $scope.menuOpen = function (mdMenu) {
      mdMenu.open();
    };

    $scope.groupItem = function(groupBy, row) {
      $scope.groupBy = groupBy;
      $scope.campaignId = row.campaignId;
      $scope.campaignName = row.campaignName;
      $scope.query.page = 1;
      $scope.query.__tk++;
      $scope.report = {
        rows: [],
        totalRows: 0
      };
      $(window).trigger('resize');
    };

    $scope.backToAllCampaign = function() {
      $scope.groupBy = 'campaignId';
      $scope.campaignId = '';
      $scope.campaignName = '';
      $scope.query.page = 1;
      $scope.query.__tk++;
      $scope.report = {
        rows: [],
        totalRows: 0
      };
      $(window).trigger('resize');
    };

    $scope.thirdPartyTrafficSourceChanged = function(id) {
      $scope.taskId = '';
      $scope.thirdPartyTrafficSourceId = id;
      $scope.groupBy = 'campaignId';
      $scope.campaignId = '';
      $scope.campaignName = '';
      $scope.fromDate = moment().format('YYYY-MM-DD');
      $scope.fromTime = '00:00';
      $scope.toDate = moment().add(1, 'days').format('YYYY-MM-DD');
      $scope.toTime = '00:00';
      self.checkTrafficSourceTask(id);
      // reset Timezone、Mesh size
      self.setFilter(self.thirdPartyTrafficSourceMap[id].trustedTrafficSourceId);
    };

    $scope.onGroupByChanged = function() {
      $scope.query.page = 1;
      $scope.query.__tk++;
    };

    $scope.fromDateChanged = function(date) {
      $scope.toDateOptions.minDate = date;
      self._timeSpanReset.call(self, date);
    };

    $scope.toDateChanged = function(date) {
      $scope.fromDateOptions.maxDate = date;
      self._timeSpanReset.call(self, null, date);
    };

    $scope.isBeforeDate = function() {
      return moment(new Date($scope.fromDate)).diff(moment(new Date($scope.toDate))) > 0;
    };

    $scope.addOrEditTsReference = function(tsId) {
      var item = tsId ? self.thirdPartyTrafficSourceMap[tsId] : null;
      self.$mdDialog.show({
        clickOutsideToClose: false,
        escapeToClose: false,
        controller: ['$mdDialog', '$scope', 'ThirdPartyTrafficSource', TsReferenceCtrl],
        controllerAs: 'ctrl',
        focusOnOpen: false,
        bindToController: true,
        locals: {item: angular.copy(item), templateTrafficSources: self.$scope.templateTrafficSources, thirdPartyTrafficSources: self.$scope.thirdPartyTrafficSources, templateTrafficSourceMap: self.templateTrafficSourceMap},
        templateUrl: 'tpl/ts-reference-dialog.html?' + +new Date()
      }).then(function() {
        self._getThirdPartyTrafficSource().then(function(oData) {
          self.$scope.thirdPartyTrafficSources.forEach(function(data) {
            self.thirdPartyTrafficSourceMap[data.id] = data;
          });
        });
      });
    };

    $scope.$watch('query', function (newVal, oldVal) {
      if (!newVal || !newVal.limit) {
        return;
      }
      if (angular.equals(newVal, oldVal)) {
        return;
      }
      if (oldVal && (newVal.order != oldVal.order || newVal.limit != oldVal.limit) && newVal.page > 1) {
        $scope.query.page = 1;
        return;
      }

      self.getThirdOffers();
    }, true);
  };

  TsreportCtrl.prototype.setFilter = function(trustedTrafficSourceId) {
    var self = this, $scope = this.$scope, templateTrafficSourceObj = self.templateTrafficSourceMap[trustedTrafficSourceId], $moment = self.$moment;
    self.$scope.meshSizeArr = templateTrafficSourceObj.apiMeshSize.split(',');
    var apiTimezoneArr = templateTrafficSourceObj.apiTimezones;
    var isExist = apiTimezoneArr.some(function(timezone) {
      return timezone.id == self.$scope.timezoneId;
    });
    self.$scope.timezoneId = isExist ? self.$scope.timezoneId : apiTimezoneArr[0].id;
    self.$scope.timezones = apiTimezoneArr;
    apiTimezoneArr.forEach(function(timezone) {
      self.timezoneMap[timezone.id] = timezone;
    });
    if(templateTrafficSourceObj.apiEarliestTime) {
      var formatEarly =  $moment().subtract(templateTrafficSourceObj.apiEarliestTime, 'seconds').format('YYYY-MM-DD');
      $scope.fromDateOptions.minDate = formatEarly;
      if(!$scope.toDateOptions.minDate) {
        $scope.toDateOptions.minDate = formatEarly;
      }
      self.minDate = formatEarly;
    }
    if(templateTrafficSourceObj.apiMaxTimeSpan) {
      self.apiMaxTimeSpan = templateTrafficSourceObj.apiMaxTimeSpan;
      $scope.datetypeFilter = self._filterDateType(templateTrafficSourceObj.apiMaxTimeSpan);
    }
    if(self.$scope.meshSizeArr.length > 0) {
      self.$scope.meshSizeId = self.$scope.meshSizeArr[0];
    }
    var apiDimensions = $scope.apiDimensions = templateTrafficSourceObj.apiDimensions;
    $scope.groupBys = [];
    for(var key in apiDimensions) {
      $scope.groupBys.push({
        display: apiDimensions[key],
        name: key
      });
    }
    $scope.groupBy = $scope.groupBys[0].name;
  };

  TsreportCtrl.prototype.getThirdOffers = function() {
    var self = this, $scope = this.$scope;
    var params = {}, timezone = self.timezoneMap[$scope.timezoneId];
    angular.extend(params, $scope.query, {
      groupBy: $scope.groupBy,
      taskId: $scope.taskId
    });
    delete params.__tk;
    if($scope.campaignId) {
      params.campaignId = $scope.campaignId;
    }
    $scope.promise = self.TrafficSourceStatis.get(params, function(result) {
      if(result.status == 1) {
        $scope.report = result.data;
      }
    }).$promise;
  };

  TsreportCtrl.prototype.checkTrafficSourceTask = function(id) {
    var self = this, $timeout = this.$timeout, $scope = this.$scope;
    if(!$scope.taskProgress[id]) {
      $scope.taskProgress[id] = {
        offerStatus: false,
        progressStatus: false
      };
    }
    if(!$scope.taskProgress[id].status) {
      $scope.taskProgress[id].status = false;
    }

    function setFilterValue(data) {
      $scope.datetype = '0';
      $scope.fromDate = data.from.split('T')[0];
      $scope.toDate = data.to.split('T')[0];
      $scope.fromTime = data.from.split('T')[1];
      $scope.toTime = data.to.split('T')[1];
      $scope.meshSizeId = data.meshSize;
      $scope.timezoneId = data.tzId;
      this._timeSpanReset($scope.fromDate);
      this._timeSpanReset(null, $scope.toDate);
    }

    self.TrafficSourceSyncTask.get({thirdPartyTrafficSourceId: id}, function(oData) {
      if(oData.status == 1 && oData.data.length > 0) {
        var data = oData.data[0];
        if(data.status == 0 || data.status == 1) { // create or running
          $scope.taskProgress[id].progressStatus = true;
          if(!$scope.taskProgress[id].progress) {
            $scope.taskProgress[id].progress = Math.random()*40 + 10;
            self.loadOfferProgress(id);
          }
          $timeout(function() {
            if($scope.thirdPartyTrafficSourceId == id) {
              self.checkTrafficSourceTask(id);
            }
          }, 3000);
        } else if (data.status == 2) { // error
          $scope.taskProgress[id].progressStatus = false;
          $scope.taskProgress[id].taskErrorMeg = data.message;
          if($scope.taskProgress[id].progress) {
            self.loadOfferProgress(id, true, true);
          }
          setFilterValue.call(self, data);
        } else if(data.status == 3) { // Finish
          $scope.taskProgress[id].progressStatus = false;
          $scope.taskProgress[id].offerStatus = true;
          $scope.taskId = data.id;
          setFilterValue.call(self, data);
          if($scope.taskProgress[id].progress) {
            self.loadOfferProgress(id, true);
          } else {
            $scope.query.page = 1;
            $scope.query.__tk++;
          }
        }
      } else if (oData.status == 1 && oData.data.length == 0) {
        $scope.taskProgress[id].offerStatus = true;
        $scope.report = {rows: [], totalRows: 0};
      }
    });
  };

  TsreportCtrl.prototype.loadOfferProgress = function(id, isFinished, isError) {
    var self = this, $timeout = this.$timeout, $scope = this.$scope;
    if(isFinished) {
        $scope.taskProgress[id].progress = 100;
        $scope.taskProgress[id].progressNum = 100;
        if(!isError) {
          $scope.query.page = 1;
          $scope.query.__tk++;
        }
    } else {
      $timeout(function() {
        if($scope.taskProgress[id].progress < 80 && $scope.taskProgress[id].status == false) {
          $scope.taskProgress[id].progress = $scope.taskProgress[id].progress + (Math.random()/10);
          $scope.taskProgress[id].progressNum = new Number($scope.taskProgress[id].progress).toFixed(2);
          self.loadOfferProgress(id);
        } else if($scope.taskProgress[id].progress <= 98 && $scope.taskProgress[id].progress >= 80 && $scope.taskProgress[id].status == false) {
          $scope.taskProgress[id].progress = $scope.taskProgress[id].progress + (Math.random()/100);
          $scope.taskProgress[id].progressNum = new Number($scope.taskProgress[id].progress).toFixed(2);
          self.loadOfferProgress(id);
        }
      }, 100);
    }
  };

  TsreportCtrl.prototype.getDateRange = function(value) {
    var self = this, DateRangeUtil = self.DateRangeUtil, $scope = self.$scope;
    var utcOffset = $scope.timezoneId && self.timezoneMap && self.timezoneMap[$scope.timezoneId] && self.timezoneMap[$scope.timezoneId].shift || '+00:00';
    var fromDate = DateRangeUtil.fromDate(value, utcOffset);
    var toDate = DateRangeUtil.toDate(value, utcOffset);
    if (value == '0') {
      self.pageStatus.from = moment(self.$scope.fromDate).format('YYYY-MM-DD') + 'T' + self.$scope.fromTime;
      self.pageStatus.to = moment(self.$scope.toDate).format('YYYY-MM-DD') + 'T' + self.$scope.toTime;
    } else {
      self.pageStatus.from = fromDate + 'T00:00';
      self.pageStatus.to = toDate + 'T00:00';
    }
  };

  TsreportCtrl.prototype._getTemplateTrafficSource = function() {
    var self = this;
    return self.TemplateTrafficSource.get({support: true}, function(oData) {
      self.$scope.templateTrafficSources = oData.data.lists;
    }).$promise;
  };

  TsreportCtrl.prototype._getThirdPartyTrafficSource = function() {
    var self = this;
    return self.ThirdPartyTrafficSource.get(null, function(oData) {
      self.$scope.thirdPartyTrafficSources = oData.data.lists;
    }).$promise;
  };

  TsreportCtrl.prototype._getProfile = function() {
    var self = this;
    return self.Profile.get(null, function(oData) {
      self.$scope.timezoneId = oData.data.timezoneId;
    }).$promise;
  };

  TsreportCtrl.prototype._filterDateType = function(apiMaxTimeSpan) {
    var self = this, $scope = self.$scope, $moment = this.$moment, DateRangeUtil = this.DateRangeUtil;
    return function(datetype) {
      if (datetype.value == "0") {
        return true;
      }
      var utcOffset = $scope.timezoneId && self.timezoneMap && self.timezoneMap[$scope.timezoneId] && self.timezoneMap[$scope.timezoneId].shift || '+00:00';
      var fromDate = $moment(DateRangeUtil.fromDate(datetype.value,  utcOffset)),
          toDate = $moment(DateRangeUtil.toDate(datetype.value, utcOffset)),
          diffDate = toDate.diff(fromDate)/1000;

      return apiMaxTimeSpan > diffDate;
    }
  };

  TsreportCtrl.prototype._timeSpanReset = function(fromDate, toDate) {
    var self = this, $scope = self.$scope, tempToDate, tempFromDate;
    if(fromDate) {
      if(moment(new Date($scope.toDate)).diff(new Date(self.minDate)) < 0 || moment(new Date($scope.toDate)).diff(new Date(self.maxDate)) > 0) {
        tempToDate = moment(new Date($scope.fromDate)).add(Math.floor(self.apiMaxTimeSpan/24/3600), 'day');
        if(moment(new Date(tempToDate)).diff(new Date(self.maxDate)) <= 0 && moment(new Date(tempToDate)).diff(new Date(self.minDate)) >= 0) {
          $scope.toDateOptions.maxDate = moment(new Date(tempToDate));
        } else {
          $scope.toDateOptions.maxDate = moment(new Date(self.maxDate));
        }
      } else {
        var diffDate = moment(new Date($scope.toDate)).diff(moment(new Date($scope.fromDate)))/1000;
        $scope.fromDateOptions.maxDate = moment(new Date($scope.toDate)).format('YYYY-MM-DD');
        var timeSpan = Math.floor((self.apiMaxTimeSpan - diffDate)/(24 * 3600))
        if (self.apiMaxTimeSpan >= diffDate) {
          if(moment(moment(new Date($scope.toDate)).add(timeSpan, 'day').format('YYYY-MM-DD')).isBefore(moment(new Date(self.maxDate)))) {
            if(timeSpan < 0) {
              $scope.toDateOptions.maxDate = moment(new Date(self.maxDate)).format('YYYY-MM-DD');
            } else {
              $scope.toDateOptions.maxDate = moment(new Date($scope.toDate)).add(timeSpan, 'day').format('YYYY-MM-DD');
            }
          } else {
            $scope.toDateOptions.maxDate = moment(new Date(self.maxDate));
          }
          if(moment(moment(new Date($scope.fromDate)).subtract(timeSpan, 'day').format('YYYY-MM-DD')).isAfter(moment(new Date(self.minDate)))) {
            if(timeSpan < 0) {
              $scope.fromDateOptions.minDate = moment(new Date(self.minDate)).format('YYYY-MM-DD');
            } else {
              $scope.fromDateOptions.minDate = moment(new Date($scope.fromDate)).subtract(timeSpan, 'day').format('YYYY-MM-DD');
            }
          } else {
            $scope.fromDateOptions.minDate = moment(new Date(self.minDate));
          }
        } else {
          $scope.fromDateOptions.minDate = moment(new Date($scope.toDate)).subtract(self.apiMaxTimeSpan/24/3600, 'day').format('YYYY-MM-DD');
        }
      }
    } else if(toDate) {
      if(moment(new Date($scope.fromDate)).diff(new Date(self.minDate)) < 0 || moment(new Date($scope.fromDate)).diff(new Date(self.maxDate)) > 0) {
        tempFromDate = moment(new Date($scope.toDate)).subtract(Math.floor(self.apiMaxTimeSpan/24/3600), 'day');
        if(moment(new Date(tempFromDate)).diff(new Date(self.minDate)) >= 0 && moment(new Date(tempFromDate)).diff(new Date(self.maxDate)) <= 0) {
          $scope.fromDateOptions.minDate = moment(new Date(tempFromDate));
        } else {
          $scope.fromDateOptions.minDate = moment(new Date(self.minDate));
        }
      } else {
        var diffDate = moment(new Date($scope.toDate)).diff(moment(new Date($scope.fromDate)))/1000;
        $scope.toDateOptions.minDate = moment(new Date($scope.fromDate)).format('YYYY-MM-DD');
        var timeSpan = Math.floor((self.apiMaxTimeSpan - diffDate)/(24 * 3600))
        if (self.apiMaxTimeSpan >= diffDate) {
          if(moment(moment(new Date($scope.toDate)).add(timeSpan, 'day').format('YYYY-MM-DD')).isBefore(moment(new Date(self.maxDate)))) {
            if(timeSpan < 0) {
              $scope.toDateOptions.maxDate = moment(new Date(self.maxDate)).format('YYYY-MM-DD');
            } else {
              $scope.toDateOptions.maxDate = moment(new Date($scope.toDate)).add(timeSpan, 'day').format('YYYY-MM-DD');
            }
          } else {
            $scope.toDateOptions.maxDate = moment(new Date(self.maxDate));
          }
          if(moment(moment(new Date($scope.fromDate)).subtract(timeSpan, 'day').format('YYYY-MM-DD')).isAfter(moment(new Date(self.minDate)))) {
            if(timeSpan < 0) {
              $scope.fromDateOptions.minDate = moment(new Date(self.minDate)).format('YYYY-MM-DD');
            } else {
              $scope.fromDateOptions.minDate = moment(new Date($scope.fromDate)).subtract(timeSpan, 'day').format('YYYY-MM-DD');
            }
          } else {
            $scope.fromDateOptions.minDate = moment(new Date(self.minDate));
          }
        } else {
          $scope.toDateOptions.maxDate = moment(new Date($scope.fromDate)).add(self.apiMaxTimeSpan/24/3600, 'day').format('YYYY-MM-DD');
        }
      }
    }
  };

  TsreportCtrl.groupBy = [
    {
      display: 'CampaignId',
      name: 'campaignId'
    },
    {
      display: 'WebsiteId',
      name: 'websiteId'
    },
    {
      display: 'V1',
      name: 'v1'
    },
    {
      display: 'V2',
      name: 'v2'
    },
    {
      display: 'V3',
      name: 'v3'
    },
    {
      display: 'V4',
      name: 'v4'
    },
    {
      display: 'V5',
      name: 'v5'
    },
    {
      display: 'V6',
      name: 'v6'
    },
    {
      display: 'V7',
      name: 'v7'
    },
    {
      display: 'V8',
      name: 'v8'
    },
    {
      display: 'V9',
      name: 'v9'
    },
    {
      display: 'V10',
      name: 'v10'
    }
  ];

  function TsReferenceCtrl($mdDialog, $scope, ThirdPartyTrafficSource) {
    this.$mdDialog = $mdDialog;
    this.$scope = $scope;
    this.ThirdPartyTrafficSource = ThirdPartyTrafficSource;

    this.init();
    this.initEvent();
  }

  TsReferenceCtrl.prototype.init = function() {
    this.title = this.item ? 'edit' : 'add';
    this.cancel = this.$mdDialog.cancel;
    this.$scope.templateTrafficSources = this.templateTrafficSources;
    if(this.item) {
      this.$scope.templateTrafficSourceObj = this.templateTrafficSourceMap[this.item.trustedTrafficSourceId] || {};
      this.item.trustedTrafficSourceId = this.item.trustedTrafficSourceId.toString();
      this.$scope.formData = this.item;
    }
  };

  TsReferenceCtrl.prototype.initEvent = function() {
    var self = this, thirdPartyTrafficSources = this.thirdPartyTrafficSources;
    self.$scope.checkName = function(name, id) {
      self.$scope.editForm.name.$setValidity('checkName', !(thirdPartyTrafficSources.some(function(thirdPartyTrafficSource) {
        if(id && id == thirdPartyTrafficSource.id) {
          return false;
        }
        return thirdPartyTrafficSource.name == name;
      })));
    };
    self.$scope.tsChanged = function(id) {
      self.$scope.templateTrafficSourceObj = self.templateTrafficSourceMap[id];
    };
    self.save = function() {
      self.$scope.editForm.$setSubmitted();
      if(self.$scope.editForm.$valid) {
        self.$scope.saveStatus = true;
        var formData = angular.copy(self.$scope.formData), templateTrafficSourceObj = self.$scope.templateTrafficSourceObj;
        formData.trafficId = formData.trustedTrafficSourceId;
        delete formData.trustedTrafficSourceId;
        if(+templateTrafficSourceObj.apiMode == 1) {
          delete formData.password;
          delete formData.account;
        } else if (+templateTrafficSourceObj.apiMode == 2) {
          delete formData.token;
        }
        if(self.item) {
          self.ThirdPartyTrafficSource.update({id: self.item.id}, formData, function(oData) {
            self.$mdDialog.hide();
            self.$scope.saveStatus = false;
          });
        } else {
          self.ThirdPartyTrafficSource.save(formData, function(oData) {
            self.$mdDialog.hide();
            self.$scope.saveStatus = false;
          });
        }
      }
    };
  };
})();
