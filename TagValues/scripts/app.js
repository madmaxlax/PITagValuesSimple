/// <reference path="C:\Apps\Dropbox\Dev\typings\angularjs\angular.d.ts" />

var PIWEBAPIURL = 'https://localhost';

//stupid IE compatibility thing
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}
//quick enhancement to add the length to objects, not just arrays
// Object.prototype._length = function () {
//   return Object.keys(this).length;
// };

(function () {
  var app = angular.module('myapp', ['ngResource', 'LocalStorageModule', 'yaru22.angular-timeago', 'ngMaterial']);
  app.config(['$httpProvider',
    function ($httpProvider) {
      $httpProvider.defaults.useXDomain = true;
      $httpProvider.defaults.withCredentials = true;
      //$httpProvider.defaults.cache = true;
      //delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
  ]);
  app.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      //.primaryPalette('yellow')
      //.accentPalette('deep-orange');
      .primaryPalette('yellow')
      .accentPalette('deep-orange');
  });
  app.directive('selectOnClick', ['$window', function ($window) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.on('click', function () {
          if (!$window.getSelection().toString()) {
            // Required for mobile Safari
            this.setSelectionRange(0, this.value.length);
          }
        });
      }
    };
  }]);
  app.directive('piInterfaceCard', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'scripts/directives/interfacecard.html'
    };
  });
  app.directive('piIssueCard', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'scripts/directives/issuecard.html'
    };
  });
  app.directive('piPlantInfoCard', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'scripts/directives/plantinfocard.html'
    };
  });
  app.directive('piRecentIssuesCard', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'scripts/directives/recentissuescard.html'
    };
  });

  app.filter('encodeURIComponent', function () {
    return window.encodeURIComponent;
  });

  // app.directive('piVal', function () {
  //   return {
  //     restrict: 'E',
  //     template: '<span ng-class="">{{data.selectedPlant.Attributes[\'Ping status\'].Value.Value}}</span>'
  //   };
  // });

  app.directive('piTimestamp', ['$filter', function ($filter) {
    return {
      restrict: 'E',
      template: ' <span class="pi-value-timestamp" ng-class="TimestampClass(timestamp)">{{TimestampFormatted(timestamp)}}</span>',
      scope: {
        prefs: '=',
        timestamp: '='
      },
      link: function (scope, element, attrs) {
        scope.TimestampClass = function (timestamp) {
          var timeDif = (Date.now() - Date.parse(timestamp)) / 60000;
          if (timeDif < 1)//less than 1 minute
          {
            return 'lt1minutes';
          }
          if (timeDif < 2)//less than 2 minutes
          {
            return 'lt2minutes';
          }
          if (timeDif < 10)//less than 10 minutes
          {
            return 'lt10minutes';
          }
          if (timeDif < 60)//less than 60 minutes / hr
          {
            return 'lt60minutes';
          }
          if (timeDif < 120)//less than 120 minutes / 2 hrs
          {
            return 'lt120minutes';
          }
          if (timeDif < 720)//less than 720 minutes / 6 hrs
          {
            return 'lt720minutes';
          }
          if (timeDif < (24 * 60))//less than 1400 minutes / 24hrs
          {
            return 'lt1440minutes';
          }
          if (timeDif > (24 * 60))//less than 1400 minutes / 24hrs
          {
            return 'oldvalue';
          }

        };
        scope.TimestampFormatted = function (timestamp) {
          if (timestamp == null) {
            return "";
          }
          if (scope.prefs.tagsTimeago) {
            return $filter('timeAgo')(timestamp);
          }
          if (scope.prefs.timeAMPM) {
            return $filter('date')(timestamp, 'yyyy-MM-dd h:mm:ss a');
          }
          else {
            return $filter('date')(timestamp, 'yyyy-MM-dd HH:mm:ss');
          }

        };
      }
    };
  }]);
  app.directive('piLabelValue', ['$filter', function ($filter) {
    return {
      restrict: 'E',
      template: ' <span class="pi-label-value" ng-class="getLabelClassesFromStatusText(ValueFormatted(value))">{{ValueFormatted(value)}}</span>',
      scope: {
        value: '=',
      },
      link: function (scope, element, attrs) {
        //function to check the value type and get the right string value
        scope.ValueFormatted = function (tag) {
          // console.warn("ValueFormatted");
          if (tag == null) {
            return '';
          }
          if (tag.Value == null) {
            return tag;
          }

          if (tag.Value.Value != null) {
            tag = tag.Value;
          }
          //if its a digital state, use that Name string
          if (tag.Name != null) {
            return tag.Name;
          }
          //if its a digital state, use that Name string
          if (tag.Value.Name != null) {
            return tag.Value.Name;
          }
          var returnString = tag.Value;

          //the date pattern used by PI Web API (and general JSON) example 2016-07-14T13:46:40Z or 2016-07-14T13:46:40.123Z
          var datePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z/;

          //check if its a string, not a number, then check if the pattern matches
          if (typeof (returnString) === 'string' && returnString.match(datePattern) !== null) {
            returnString = $filter('date')(returnString, 'yyyy-MM-dd HH:mm:ss');
          }
          return returnString;
        };
        //var valueString = scope.ValueFormatted(scope.value);
        //return a bootstrap label name for a span
        scope.getLabelClassesFromStatusText = function (statusText) {
          if (statusText == null || typeof (statusText) !== 'string') {
            return "";
          }
          statusText = statusText.toLowerCase();
          var classString = 'label label-';
          if (statusText.startsWith('all good') || statusText.startsWith('good') || statusText.startsWith('ok')) {
            return classString + 'success'; //green
          }
          if (statusText.startsWith('update re')) {
            return classString + 'info'; //blue
          }
          if (statusText.startsWith('alert') || statusText.startsWith('problem') || statusText.startsWith('i/o timeout')) {
            return classString + 'danger'; //red
          }
          //for everything else: Transitioning to opc, idle, maintenance, shutdown
          //use orange 
          return classString + 'warning';
        };
      }
    };
  }]);
  app.directive('piValue', ['$filter', function ($filter) {
    return {
      restrict: 'E',
      template: ' <span class="pi-value" ng-class="ValueClass(value)">{{ValueFormatted(value)}}</span>',
      scope: {
        prefs: '=',
        value: '=',
        format: '=',
      },
      link: function (scope, element, attrs) {
        scope.ValueClass = function (tag) {
          //optional parameter, check if it's there
          if (typeof this.format === "undefined" || this.format === undefined || this.format == null || !this.format) {
            return "";
          }
          //{'alert-warning': (tag.curVal.Value.IsSystem && tag.curVal.Value.Name != 'Good'),'alert-success': (valCheck(tag) === 'Good')  }
          if (tag == null) {
            return '';
          }
          if (tag.Value == null) {
            return 'pi-tag-value-normal';
          }

          if (tag.Value.Value != null) {
            tag = tag.Value;
          }
          //if its a digital state, use that Name string
          if (tag.IsSystem) {
            if (tag.Value === "Good") {
              return 'goodsysval';
            }
            else {
              return 'systemdigitalstate';
            }
          }
        };
        //function to check the value type and get the right string value
        scope.ValueFormatted = function (tag) {
          if (tag == null) {
            return '';
          }
          if (tag.Value == null) {
            return tag;
          }

          if (tag.Value.Value != null) {
            tag = tag.Value;
          }
          //if its a digital state, use that Name string
          if (tag.Name != null) {
            return tag.Name;
          }
          //if its a digital state, use that Name string
          if (tag.Value.Name != null) {
            return tag.Value.Name;
          }
          var returnString = tag.Value;

          //the date pattern used by PI Web API (and general JSON) example 2016-07-14T13:46:40Z or 2016-07-14T13:46:40.123Z
          var datePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z/;

          //check if its a string, not a number, then check if the pattern matches
          if (typeof (returnString) === 'string' && returnString.match(datePattern) !== null) {
            returnString = $filter('date')(returnString, 'yyyy-MM-dd ' + (scope.prefs.timeAMPM ? 'h:mm:ss a' : 'HH:mm:ss'));
          }
          return returnString;
        };
      }
    };
  }]);

  app.factory("PIWebCalls", ['$resource', function PIWebCallsFactory($resource) {
    return {
      reformatArray: function reformatArray(arr) {
        var obj = arr.reduce(function (obj, item) {
          obj[item.Name] = item;
          return obj;
        }, {});
        return obj;
      },
      plantsCall: $resource(PIWEBAPIURL+"/piwebapi/assetservers/F1RSBZod-1oDvEacRfdZO28CWwSE9VQ1kxLVMtMDY0Mzc/elements?searchFullHierarchy=true&templateName=Plant"),
      elementAttrValuesCall: $resource(PIWEBAPIURL+"/piwebapi/streamsets/:webid/value"),
      interfacesCall: $resource(PIWEBAPIURL+"/piwebapi/elements/:webid/elements?templateName=Interface"),
      updateValueCall: $resource(PIWEBAPIURL+"/piwebapi/streams/:webid/value"),
      getValuesAdHocCall: $resource(PIWEBAPIURL+"/piwebapi/streamsets/value"),
      openIssuesEventFramesCall: $resource(PIWEBAPIURL+"/piwebapi/assetservers/F1RSBZod-1oDvEacRfdZO28CWwSE9VQ1kxLVMtMDY0Mzc/eventframes?templateName=Issue&searchMode=InProgress&startTime=*-4w"),//default last 8 hours. added 4 weeks in case something is older
      recentIssuesEventFramesCall: $resource(PIWEBAPIURL+"/piwebapi/assetservers/F1RSBZod-1oDvEacRfdZO28CWwSE9VQ1kxLVMtMDY0Mzc/eventframes?templateName=Issue"), //default last 8 hours. 
      getArchivedValues: $resource(PIWEBAPIURL+"/piwebapi/streams/:webid/recorded"),
      //TagSearch: $resource(PIWEBAPIURL+"/piwebapi/dataservers/s0Zwm3Ai1HVUiBciNvrmWsBQU1RDQVBJQ09MTA/points?namefilter=:name&maxCount=:max'),
      TagSearch: $resource(PIWEBAPIURL+"/piwebapi/search/query?scope=pi::piserver&count=:max&q=(name::name AND pointsource::pointsource)'),
      TagValue: $resource(PIWEBAPIURL+"/piwebapi/streams/:webid/value"),
      TagValueGroup: $resource(PIWEBAPIURL+"/piwebapi/streamsets/value"),
      TagRecordedValues: $resource(PIWEBAPIURL+"/piwebapi/streams/:webid/recorded?maxCount=:max&startTime=*&endTime=*-5y"),
      TagAttributes: $resource(PIWEBAPIURL+"/piwebapi/points/:webid/attributes"),
      TagAttributesDescriptor: $resource(PIWEBAPIURL+"/piwebapi/points/:webid/attributes/descriptor"),
    };
  }]);

  app.controller('appController', ['$scope', '$http', '$resource', '$filter', 'localStorageService', 'PIWebCalls', '$mdSidenav', '$mdDialog', '$mdToast', function ($scope, $http, $resource, $filter, localStorageService, PIWebCalls, $mdSidenav, $mdDialog, $mdToast) {


    $scope.errors = [];
    $scope.clearErrors = function () {
      $scope.errors = [];
    };

    $scope.isLoading = false;
    $scope.startedLoading = function () {
      $scope.isLoading = true;
    };
    $scope.finishedLoading = function () {
      $scope.isLoading = false;
    };

    $scope.isUpdating = false;
    $scope.startedUpdating = function () {
      $scope.isUpdating = true;
    };
    $scope.finishedUpdating = function () {
      $scope.isUpdating = false;
    };

    $scope.toggleLeft = function () {
      $mdSidenav('right').toggle();
    };

    $scope.savePrefs = function () {
      localStorageService.set('prefs', $scope.prefs);
      $mdToast.showSimple("Preferences saved!");
    };

    //set up a watch on the errors var, and show the dialog if there's ever anything
    $scope.errorPush = function (errorObj) {
      $scope.errors.push(errorObj);
      if ($scope.errors.length > 0) {
        $mdDialog.show({
          contentElement: '#errorsDialog',
          parent: angular.element(document.body),
          // targetEvent: ev,
          clickOutsideToClose: true
        });
      }
    };
    //support for keyboard shortcuts
    $scope.shortcutKeypress = function (keyEvent) {
      //console.log(keyEvent);
      //make sure not in an input
      var targName = keyEvent.target.tagName.toLowerCase();
      if (targName !== 'input' &&
        targName !== 'textarea' &&
        targName !== 'select') {

        //various keyboard shortcuts
        // if (keyEvent.which === 105)//i
        // {
        //   $scope.prefs.showStatusCounts = !$scope.prefs.showStatusCounts;
        // }
        // else if (keyEvent.which === 112)//p
        // {
        //   $scope.prefs.showPlantStatus = !$scope.prefs.showPlantStatus;
        // }
        if (keyEvent.which === 116)//t
        {
          $scope.prefs.showTagValues = !$scope.prefs.showTagValues;
        }
        else if (keyEvent.which === 47)// / 
        {
          //focus on the plant search
          document.querySelector('#search-input-plants').focus();
          keyEvent.preventDefault();
        }
        else if (keyEvent.which === 46)// / 
        {
          //focus on the plant search
          document.querySelector('#search-input-tags').focus();
          keyEvent.preventDefault();
        }

        else if (keyEvent.which === 119)// w
        {
          //focus on the plant search
          $scope.toggleLeft();
          keyEvent.preventDefault();
        }
        else {
          console.log("Key without a shortcut", keyEvent.which);
        }

      }
    };
    $scope.data = {
      plants: []
    };
    

    //browser notifications
    $scope.getBrowerPermission = function () {
      if ($scope.prefs.browserNotifications != null && $scope.prefs.browserNotifications) {
        Notification.requestPermission();
      }
    };

    

    //arrange preferences with local storage
    $scope.prefs = {};
    //if there are no prefs yet (new user)
    if (localStorageService.get('prefs') == null) {
      //defaults
      $scope.prefs.tagsAutoRefreshEnabled = true;
      $scope.prefs.tagsAutoRefreshSeconds = 30;
      $scope.prefs.showTagValues = true;
      $scope.prefs.tagsCountLimit = 50;
      $scope.prefs.tagsSearch = 'sinus';
      $scope.prefs.timeAMPM = false;
      $scope.prefs.tagsTimeago = true;

      $scope.prefs.tagsSearch = "sinu";
      $scope.prefs.tagSearchPointsource = "";
      //$scope.prefs.resolutionCodes = {300:'No Action',301:'Restart Interface',302:'System Offline'};
      $scope.savePrefs();
    }
    else {
      $scope.prefs = localStorageService.get('prefs');
    }

    //handle polling/auto refresh
    $scope.refreshSecondsCounter = 0;
    function checkRefresh() {
      $scope.refreshSecondsCounter++;
      if ($scope.prefs.autoRefresh) {
        if ($scope.refreshSecondsCounter % 300 === 0)
          $scope.getInterfaceAlertsCount();
      }

      if ($scope.prefs.tagsAutoRefreshEnabled) {
        if ($scope.refreshSecondsCounter % $scope.prefs.tagsAutoRefreshSeconds === 0)
          $scope.RefreshTagValsGroup();
      }
    }
    //and set the autorefresh checker
    var i = setInterval(function () {
      checkRefresh();
    }, 1000);

    //close dialoge function
    $scope.closeDialog = function () {
      $mdDialog.hide();
    };
    

    //fundamental function to update the value of a given webID 
    $scope.updateValue = function (WebId, newValue) {
      $scope.startedUpdating();
      PIWebCalls.updateValueCall.save({ webid: WebId },
        {
          "Timestamp": "*",
          "Value": newValue,
          "Good": "true",
          "Questionable": "false"
        },
        function (resp) {
          //console.log("success", resp);
          //if successful, update the values
          $scope.finishedUpdating();
          $scope.getPlantData();
          $mdToast.showSimple("Value saved!");
        }, function (resp) {
          //there was an error
          $scope.errorPush({ "Error with getting values": resp });
          $scope.finishedUpdating();
        });
    };

    //searches for tags matching the user specified mask and gets their values
    $scope.newTagSearch = function () {
      $scope.data.tags = null;
      $scope.data.tagsTotalHits = 0;
      //make sure the value exists (sometimes doesnt with new users)
      if ($scope.prefs.tagsSearch != null) {
        //remove white space
        //replace internal spaces with AND because of how query handles searches with spaces as OR
        $scope.prefs.tagsSearch = $scope.prefs.tagsSearch.trim();
      }
      else {
        //just set the value
        $scope.prefs.tagsSearch = "";
      }
      //make sure the value exists (sometimes doesnt with new users)
      if ($scope.prefs.tagSearchPointsource != null) {
        //remove white space
        $scope.prefs.tagSearchPointsource = $scope.prefs.tagSearchPointsource.trim();
      }
      else {
        //just set the value
        $scope.prefs.tagSearchPointsource = "";
      }
      //only search if tags section is shown and search (or point source) is at least 3 characters
      if ($scope.prefs.showTagValues && ($scope.prefs.tagsSearch.length + $scope.prefs.tagSearchPointsource.length) > 3) {
        var star = '';
        //in case no pref exists, default to true
        if ($scope.prefs.tagSearchAddStar == null || $scope.prefs.tagSearchAddStar === true) {
          star = '*';
          $scope.prefs.tagSearchAddStar = true;
        }
        PIWebCalls.TagSearch.get({
          //replace internal spaces with AND because of how query handles searches with spaces as OR
          name: $scope.prefs.tagsSearch.replace(" ", " AND name:") + star,
          max: $scope.prefs.tagsCountLimit,
          piserver: 'PISERVERNAME',
          //replace internal spaces with AND because of how query handles searches with spaces as OR
          pointsource: (($scope.prefs.tagSearchPointsource == null || $scope.prefs.tagSearchPointsource === '') ? '*' : $scope.prefs.tagSearchPointsource.replace(" ", " AND pointsource:") + star)
        }, function (resp) {
          //console.log(resp);
          $scope.data.tags = resp.Items;
          //set var if no tags 
          if (resp.Items.length > 0) {
            //if only 1 tag, get recent values
            if (resp.Items.length === 1) {
              $scope.getRecentTagValues();
            }
            //$scope.$apply();

            //get updated values of all tags now that we have them
            $scope.RefreshTagValsGroup();

            //getting the attributes individually can be a performance hit
            //only do it if prefs say so
            if ($scope.prefs.tagsFetchAttributes) {
              $scope.getTagAttributes();
            }
            $scope.data.noTagsFound = false;
            $scope.data.tagsTotalHits = resp.TotalHits;
            $scope.data.noTagsFoundName = null;
          }
          else //no tags found
          {
            $scope.data.noTagsFound = true;
            var improved = false;
            $scope.data.noTagsFoundName = $scope.prefs.tagsSearch;
            //try adding star and setting pointsource to null
            if (!$scope.prefs.tagSearchAddStar) {
              improved = true;
              $scope.prefs.tagSearchAddStar = true;
            }
            if ($scope.prefs.tagSearchPointsource != null && $scope.prefs.tagSearchPointsource != '') {
              improved = true;
              $scope.prefs.tagSearchPointsource = '';
            }
            if (improved) {
              $mdToast.showSimple("Trying broader search");
              $scope.newTagSearch();
            }
          }
        }, function (resp) {
          //there was an error
          $scope.errorPush({ "Error with tag search query": resp });
        });
        //save settings every search?
        localStorageService.set('prefs', $scope.prefs);
      }
      else {
        $mdToast.showSimple("Your search must be at least 3 characters long");
      }
    };
    //perform a new tag search on the startup of the app
    //in the event there was already a tag search loaded from prefs
    $scope.newTagSearch();

    //function that ensures there is a auto refresh time limit if it is enabled
    $scope.tagsAutoRefreshSwitch = function () {
      if ($scope.prefs.tagsAutoRefreshSeconds == null || !$scope.prefs.tagsAutoRefreshSeconds > 0) {
        $scope.prefs.tagsAutoRefreshSeconds = 30;
      }
    };

    //DEPRICATED get updates values of each tag individually 
    $scope.RefreshTagVals = function () {
      $scope.data.tags.forEach(function (item, index) {
        //console.log(item, index);
        item.curVal = 'Loading';
        PIWebCalls.TagValue.get({
          webid: (item.WebID == null ? item.WebId : item.WebID)
        }, function (valresp) {
          item.curVal = valresp;
        });
        // PIWebCalls.TagAttributesDescriptor.get({
        //   webid: item.WebId
        // }, function (valresp) {
        //   item.descriptor = valresp.Value;
        // }, function (resp) {
        //   //there was an error
        //   $scope.errorPush({ "Error with getting plant data": resp });
        // });
      });
    };

    //for testing the error handler
    $scope.debugCreateError = function () {
      $scope.errorPush({ "Error with getting plant data": { 'test': 'test' } });
    };

    //get recent compressed/recorded values if only one tag was selected
    $scope.getRecentTagValues = function () {

      PIWebCalls.TagRecordedValues.get({
        //should only be one tag so just [0]
        webid: ($scope.data.tags[0].WebID == null ? $scope.data.tags[0].WebId : $scope.data.tags[0].WebID),
        max: 40
      }, function (valresp) {
        $scope.data.tags[0].recentValues = valresp.Items;
      });
    };

    //function that gets all attributes for a group of tags
    $scope.RefreshTagValsGroup = function () {
      var webids = [];
      $scope.data.tags.forEach(function (item, index) {
        //console.log(item, index);
        item.curVal = 'Loading';
        //sometimes, for Search Queries returned as webID mostly WebId (case difference)
        if (item.WebID == null) {
          webids.push(item.WebId);
        }
        else {
          webids.push(item.WebID);
        }

        //more than ~40 can't fit in one URL / call (restriction of PI Web API 2015 R2, newer versions allow batch calls)
        if (index > 0 && index % 30 === 0) {
          //console.log(index);
          PIWebCalls.TagValueGroup.get({
            'webid[]': webids
          }, function (valresp) {
            var tagVals = PIWebCalls.reformatArray(valresp.Items);
            if ($scope.data.tags) { //if there are tags
              $scope.data.tags.forEach(function (tag, index) {
                if (tagVals[tag.Name] != null) {
                  tag.curVal = tagVals[tag.Name].Value;
                  //delete the tag from the returned vals, if none left, exit foreach
                  delete tagVals[tag.Name];
                  //...no graceful way to exit foreach
                }
              });
            }
          }, function (resp) {
            //there was an error
            $scope.errorPush({ "Error with getting tag values": resp });
          });
          webids = []; //reset the webID's array
        }
      });

      PIWebCalls.TagValueGroup.get({
        'webid[]': webids
      }, function (valresp) {
        var tagVals = PIWebCalls.reformatArray(valresp.Items);
        if ($scope.data.tags) { //if there are tags
          $scope.data.tags.forEach(function (tag, index) {
            if (tagVals[tag.Name] != null) {
              tag.curVal = tagVals[tag.Name].Value;
              //delete the tag from the returned vals, if none left, exit foreach
              delete tagVals[tag.Name];
              //...no graceful way to exit foreach
            }
          });
        }
      });

      $scope.prefs.tagsLastUpdated = Date.now();
    };

    //function to get Tag Attributes
    //no way to get it as a grouped call at this time
    $scope.getTagAttributes = function () {

      $scope.data.tags.forEach(function (item, index) {
        var thisWebID = (item.WebID == null ? item.WebId : item.WebID);
        PIWebCalls.TagAttributes.get({
          webid: thisWebID
        }, function (valresp) {
          item.tagAttributes = PIWebCalls.reformatArray(valresp.Items);
        }, function (resp) {
          //there was an error
          $scope.errorPush({ "Error with getting plant data": resp });
        });
      });
    };


  }]);
})();
