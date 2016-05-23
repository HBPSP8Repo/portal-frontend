angular.module('chuvApp.experiments')
  .controller('NewExperimentController',[
    '$scope', 'MLUtils', '$stateParams', 'Model', '$location', '$modal', function($scope, MLUtils, $stateParams, Model, $location, $modal) {
      $scope.loaded = false;

      $scope.ml_methods_by_type = {};
      $scope.shared = {
        chosen_method: null,
        method_parameters: [],
        experiment_configuration: [],
      };
      $scope.help_is_open = true;

      $scope.type_name = function (method_name) {
        return method_name.charAt(0).toUpperCase() + method_name.slice(1) + "s";
      };

      MLUtils.list_ml_methods().$promise.then(
        function (data) {
          data.forEach(function (method) {
            method.type.forEach(function (type) {
              if (!$scope.ml_methods_by_type.hasOwnProperty(type)) {
                $scope.ml_methods_by_type[type] = [];
              }
              $scope.ml_methods_by_type[type].push(method);
            })
          })
        }
      );

      // function to be called when query and dataset are ready
      function on_data_loaded () {

        $scope.loaded = true;

        var variable_data = $scope.dataset.data[$scope.dataset.variable[0]];

        $scope.predicting_type = MLUtils.get_datatype($scope.dataset.variable[0], variable_data);
        $scope.predictor_type = $scope.predicting_type === 'real' ? 'regressor' : 'classifier';

      }


      if ($stateParams.model_slug) {
        // we have a slug: load model
        Model.get({slug: $stateParams.model_slug}, function(result) {
          $scope.model = result;
          $scope.dataset = result.dataset;
          $scope.query = result.query;
          on_data_loaded();
        });

      } else {
        // load model from data

        // step 1: load query
        var search = $location.search();
        function map_query(category) {
          return search[category]
            ? search[category].split(",").map(function (code) { return {code: code}})
            : [];
        }

        $scope.query = {
          variables: map_query("variables"),
          groupings: map_query("groupings"),
          coVariables: map_query("coVariables"),
          filters: map_query("filters"),
          textQuery: search.query,
        }

        // step 2: load dataset
        var query = angular.copy($scope.query);

        Model.executeQuery(query).success(function (queryResult) {
          $scope.loading_model = false;
          $scope.dataset = queryResult;
          on_data_loaded();
        });

        $scope.save_model = function () {
          // pass

          $modal.open({
            templateUrl: "/scripts/app/experiments/save-model-modal.html",
            controller: ['$scope', '$state', function (child_scope, $state) {
              child_scope.do_save_model = function() {

                $scope.model = {
                  title: child_scope.name,
                  config: {
                    type: 'designmatrix',
                    height: 480,
                    yAxisVariables: $scope.dataset.header.slice(0, 5),
                    xAxisVariable: null,
                    title: {text: child_scope.name }
                  },
                  dataset: $scope.dataset,
                  valid: child_scope.share,
                  query: $scope.query
                };

                // save new model
                Model.save($scope.model, function (model) {
                  $state.go('experiment', {model_slug: model.slug})
                  alert("Save ok");
                }, function(){
                  alert("Error on save!");
                });
              };

            }]
          })

        }
      }

      /**
       * Checks whether this method has already been added to the experiment with this
       * set of parameters.
       * @returns {boolean}
       */
      $scope.method_already_configured = function () {
        var method_idx, chosen_parameter_idx, other_parameter_idx, method;

        return _.any(
          $scope.shared.experiment_configuration,
          function (method) {

            return method.code == $scope.shared.chosen_method.code && _.all(
                $scope.shared.method_parameters,
                function (chosen_parameter) {

                  return _.any(
                    method.parameters,
                    function (other_parameter) {

                      return other_parameter.code == chosen_parameter.code && chosen_parameter.value == other_parameter.value

                    }
                  )
                }
              )
          }
        )
      };

      /**
       * Returns whether the current configuration is valid
       * @returns {boolean}
       */
      $scope.configuration_not_valid = function() {
        var chosen_parameter_idx;

        for (chosen_parameter_idx = 0; chosen_parameter_idx < $scope.shared.method_parameters.length; chosen_parameter_idx++) {
          if (!$scope.shared.method_parameters[chosen_parameter_idx].value) {
            return true;
          }
        }

        return false;
      };

      $scope.add_to_experiment = function () {
        $scope.shared.experiment_configuration.push({
          code: $scope.shared.chosen_method.code,
          label: $scope.shared.chosen_method.label,
          parameters: $scope.shared.method_parameters.map(function (param) { return angular.copy(param)}),
        });
      };

    }])
  .controller('ExperimentDetailsController', ['$stateParams', '$state', 'MLUtils', '$scope', '$timeout', 'User', function ($stateParams, $state, MLUtils, $scope, $timeout, User) {

    var refresh_rate = 2500; // ms
    var cancel_timeout;
    var cancelled = false;
    var is_waiting_for_finish = false;
    $scope.loading = true;
    $scope.model_slug = $stateParams.model_slug;

    function refresh_experiment_until_done () {
      if (!cancelled && !$scope.experiment.finished) {
        is_waiting_for_finish = true;
        cancel_timeout = $timeout(refresh_experiment_until_done, refresh_rate);
        get_experiment();
      }
    }

    function get_experiment () {
      MLUtils.get_experiment($stateParams.experiment_uuid).then(
        function on_get_experiment_success (response) {
          if (cancelled) return;

          $scope.experiment = response.data;

          $scope.loading = false;

          if (!is_waiting_for_finish)
            refresh_experiment_until_done();

          if (!!$scope.experiment.finished && !$scope.experiment.resultsViewed)
            MLUtils.mark_as_read($scope.experiment);

          $scope.validations = JSON.parse($scope.experiment.validations);
          $scope.algorithms = JSON.parse($scope.experiment.algorithms);
          try {
            $scope.result = JSON.parse($scope.experiment.result);
          } catch (e) {
            if (!($scope.experiment.hasError || $scope.experiment.hasServerError)) {
              $scope.experiment.hasError = true;
              $scope.experiment.result = "Invalid JSON: \n" + $scope.experiment.result;
            }
          } // pass

        },
        function on_get_experiment_fail (response) {
          if (cancelled) return;

          $scope.loading = false;
          $scope.experiment = {
            hasError: true,
            result: "This experiment doesn't exist",
            finished: true
          }
        }
      )
    }

    get_experiment();

    $scope.$on("$destroy", function () {
      if (cancel_timeout) {
        cancelled = true;
        $timeout.cancel(cancel_timeout);
      }
    });

    var user;
    $scope.sharing_working = false;
    User.get().then(function () { user = User.current(); });

    $scope.experiment_is_mine = function () {
      return $scope.experiment.createdBy.username === user.username;
    };

    $scope.mark_experiment_as_unshared = function () {
      $scope.sharing_working = true;
      MLUtils.mark_as_unshared($scope.experiment).then(function () {
        $scope.experiment.shared = false;
        $scope.sharing_working = false;
      }, function () {
        $scope.experiment.shared = true;
        $scope.sharing_working = false;
      });
    }
    $scope.mark_experiment_as_shared = function () {
      $scope.sharing_working = true;
      MLUtils.mark_as_shared($scope.experiment).then(function () {
        $scope.experiment.shared = true;
        $scope.sharing_working = false;
      }, function () {
        $scope.experiment.shared = false;
        $scope.sharing_working = false;
      });
    }

    $scope.variable_title = function (variable_code) {
      // capitalize
      return variable_code
        .split(/[ _\-]/)
        .map(function (code_part) { return code_part.replace(/^[a-z]/, function (str) {return str.toUpperCase(); })})
        .join(" ");
    };

    $scope.pvalue_quality = function (pvalue) {
      pvalue = Math.abs(pvalue);
      if (pvalue <= 0.001) return "(★★★)";
      if (pvalue <= 0.01) return "(★★)";
      if (pvalue <= 0.1) return "(★)";
      return "";
    };

  }]);
