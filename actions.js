$(document).ready(function(){


  // - - - Enter the API Key here - - - -
  var API_KEY = 'replace-this-text-with-edmunds-api-key';
  // - - - - - - - - - - - - - - - - - - -



  /* - - - - - - - - - - - - - - - - -
   * - - Variables and App Priming - -
   * - - - - - - - - - - - - - - - - -
   */
  var EDMUNDS = 'https://api.edmunds.com/';
  var VEHICLE_API_URL = EDMUNDS + 'api/vehicle/v2/';
  var MAINTENANCE_API_URL = EDMUNDS + 'v1/api/maintenance/actionrepository/';
  var MAINTENANCE_COST_API_URL = EDMUNDS + 'v1/api/maintenance/ziplaborrate/';
  var DATA_TYPE_AND_KEY = 'fmt=json&api_key=' + API_KEY;

  var ALL_MAKES = [];
  var RANGE_YEARS = createYearList();
  var STORE = {};
  initializeStore();

  // Create Year Selector
  setSelect(RANGE_YEARS, null, null, 'yearSelector', 'Select Year');

  // Load the initial selector data
  loadData();


  /* - - - - - - - - - - - -
   * - - Event  Handlers - -
   * - - - - - - - - - - - -
   */
  $("#btnClearSelections").click(function() {
    initializeStore();
    clearSelects();
  });

  $("#yearSelector").change(function(){
    clearErrorIfPresent();

    STORE.year = Number($(this).val());

    var makesFilteredByYear = [];

    ALL_MAKES.map(function(nextMake) {
      nextMake.makeYears.map(function(nextYear) {
        if (Number(nextYear) === Number(STORE.year)) {
          // console.log(nextMake.name + ' made a ' + nextYear + ' model');
          makesFilteredByYear.push(nextMake);
        }
      });
      // Includes was only recently supported in Firefox
      // if (nextMake.makeYears.includes(STORE.year)) {
      //   makesFilteredByYear.push(nextMake);
      // }
    });

    clearSelects('year');

    setSelect(makesFilteredByYear, 'niceName', 'name', 'makeSelector', 'Select Make');
    document.getElementById('makeSelector').disabled = false; //enable
  });

  $("#makeSelector").change(function(){
    clearErrorIfPresent();

    var theChosenOne = $(this).val();
    STORE.make = ALL_MAKES.find(
      function(next) {
        return next.niceName == theChosenOne;
      }
    );

    var modelsFilteredByYear = [];

    STORE.make.models.map(function(nextModel) {
      nextModel.modelYears.map(function(nextYear) {
        if (Number(nextYear) === STORE.year) {
          // console.log(nextModel.name + ' was a ' + nextYear + ' model');
          modelsFilteredByYear.push(nextModel);
        }
      });
      // Includes was only recently supported in Firefox
      // if (nextModel.modelYears.includes(Number(STORE.year))) {
      //   modelsFilteredByYear.push(nextModel);
      // }
    });

    clearSelects('make');

    STORE.models = modelsFilteredByYear;

    setSelect(modelsFilteredByYear, 'niceName', 'name', 'modelSelector', 'Select Model');
    document.getElementById('modelSelector').disabled = false; //enable
  });

  $("#modelSelector").change(function(){
    clearErrorIfPresent();

    var chosenModel = $(this).val();

    STORE.model = STORE.models.find(
      function(next) {
        return next.niceName == chosenModel;
      }
    );

    var requestForStyle =
      VEHICLE_API_URL +
      STORE.make.niceName + '/' +
      STORE.model.niceName + '/' +
      STORE.year + '?' +
      DATA_TYPE_AND_KEY;

    $.get(requestForStyle).success(function(data) {
      STORE.styles = data.styles;

      clearSelects('model');

      setSelect(STORE.styles || [], 'id', 'name', 'trimSelector', 'Select Trim');
      document.getElementById('trimSelector').disabled = false; // enable
    });
  });

  $("#trimSelector").change(function(){
    clearErrorIfPresent();

    var chosenStyle = $(this).val();
    STORE.style = STORE.styles.find(
      function(next) {
        return next.id == chosenStyle;
      }
    )

    var requestForEngines =
      VEHICLE_API_URL + 'styles/' +
      STORE.style.id + '/engines?' +
      DATA_TYPE_AND_KEY;

    var requestForTransmissions =
      VEHICLE_API_URL + 'styles/' +
      STORE.style.id + '/transmissions?' +
      DATA_TYPE_AND_KEY;

    clearSelects('trim');

    $.get(requestForEngines).success(function(data) {
      STORE.engines = data.engines;

      setEngineSelect(STORE.engines || [], 'engineSelector', 'Select Engine')
      document.getElementById('engineSelector').disabled = false; //enable
    });

    $.get(requestForTransmissions).success(function(data) {
      STORE.transmissions = data.transmissions;

      setSelect(STORE.transmissions || [], 'id', 'transmissionType', 'transmissionSelector', 'Select Transmission');
      document.getElementById('transmissionSelector').disabled = false; //enable
    });
  });

  $("#engineSelector").change(function() {
    clearErrorIfPresent();

    var chosenEngine = $(this).val();
    STORE.engine = STORE.engines.find(
      function(next) {
        return next.id == chosenEngine;
      }
    )
  });

  $("#transmissionSelector").change(function() {
    clearErrorIfPresent();

    var chosenTransmission = $(this).val();
    STORE.transmission = STORE.transmissions.find(
      function(next) {
        return next.id == chosenTransmission;
      }
    )
  });

  $("#mileageInput").change(function() {
    clearErrorIfPresent();

    STORE.mileage = Number($(this).val());
  });

  $("#zipInput").change(function() {
    clearErrorIfPresent();

    STORE.zip = Number($(this).val());
  });

  $("#getMaintenance").click(function() {
    // console.log('STORE:', STORE);

    if (allSpecsPresent()) {
      var modelYear = STORE.model.years.find(function(next) {
        return next.year === STORE.year;
      });

      var laborCostRequest =
        MAINTENANCE_COST_API_URL +
        STORE.zip + '?' +
        DATA_TYPE_AND_KEY;

      var maintenanceRequest =
        MAINTENANCE_API_URL +
        'findbymodelyearid?modelyearid=' +
        modelYear.id + '&' +
        DATA_TYPE_AND_KEY;

      $.get(laborCostRequest).success(function(data) {
        if (data &&
          data.zipLaborRateHolder &&
          data.zipLaborRateHolder[0] &&
          (data.zipLaborRateHolder[0].zipcode === STORE.zip.toString())
        ) {
          STORE.laborCost = Number(data.zipLaborRateHolder[0].laborRate);
          // console.log('Labor Cost:', STORE.laborCost);
        }

        $.get(maintenanceRequest).success(function(data) {
          var todos = processActions(data.actionHolder);

          var todosHTML = '';

          if(todos.firstQuarter.length) {
            todosHTML += '</br><ul class="list-group">' +
            '<li class="list-group-item"><h4>Under 25,000 Miles</h4></li>' +
            todos.firstQuarter.join('') + '</ul>';
          }

          if(todos.secondQuarter.length) {
            todosHTML += '</br><ul class="list-group">' +
            '<li class="list-group-item"><h4>25,000 to 50,000 Miles</h4></li>'
            + todos.secondQuarter.join('') + '</ul>';
          }
          if(todos.thirdQuarter.length) {
            todosHTML += '</br><ul class="list-group">' +
            '<li class="list-group-item"><h4>50,000 to 75,000 Miles</h4></li>'
            + todos.thirdQuarter.join('') + '</ul>';
          }
          if(todos.fourthQuarter.length) {
            todosHTML += '</br><ul class="list-group">' +
            '<li class="list-group-item"><h4>75,000 to 100,000 Miles</h4></li>'
            + todos.fourthQuarter.join('') + '</ul>';
          }
          if(todos.greater.length) {
            todosHTML += '</br><ul class="list-group">' +
            '<li class="list-group-item"><h4>Greater than 100,000 Miles</h4></li>'
            + todos.greater.join('') + '</ul>';
          }

          if (todosHTML.length === 0) {
            todosHTML = '<div class="alert alert-info" role="info">'
            + '<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>'
            + '<span class="sr-only">Error:</span>'
            + ' Unable to retrieve maintenance actions for the selected specifications.</br>Please make another selection.'
            + '</div>';
          }

          document.getElementById('responseContent').innerHTML =
            '<h3>' + createHeaderName() + '</h3>' + todosHTML;
            // '<pre>' + JSON.stringify(data, undefined, 2) + '</pre>';
        });
      });
    } else {
      STORE.error = true;
      document.getElementById('responseContent').innerHTML =
        '<div class="alert alert-danger" role="alert">'
        + '<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>'
        + '<span class="sr-only">Error:</span>'
        + ' Please make all selections and ensure that your zip code is valid and mileage is between 0 and 3000000'
        + '</div>';
    }
  });

  /* - - - - - - - - - - - - - - - - -
   * - - - - - Functions - - - - - - -
   * - - - - - - - - - - - - - - - - -
   */

  function clearErrorIfPresent() {
    if (STORE.error) {
      STORE.error = false;
      document.getElementById('responseContent').innerHTML =
        '<h4><i>Please make your vehicle specification selections<i></h4>';
    }
  }

  function processActions(data) {
    var maintenanceToDo = {
      firstQuarter: [],
      secondQuarter: [],
      thirdQuarter: [],
      fourthQuarter: [],
      greater: []
    };

    data.map(function(next) {
      if (next.intervalMileage && (next.intervalMileage <= STORE.mileage)) {
        var newString = '<li class="list-group-item"><h6>Every ' + next.intervalMileage + ' miles:</h6> • '
          + next.action + ' ' + next.item;
        if (next.partUnits && next.partCostPerUnit) {
          newString += '</br> • Part Cost: $' + Number(
            Number(next.partUnits) * Number(next.partCostPerUnit)
          ).toFixed(2);
        }
        if (next.laborUnits && STORE.laborCost) {
          newString += '</br> • Labor Cost: $' + Number(
            Number(next.laborUnits) * STORE.laborCost
          ).toFixed(2);
        }
        if (next.note1) {
          newString += '</br> • Note 1: ' + next.note1
        }
        if (next.note2) {
          newString += '</br> • Note 2: ' + next.note2
        }
        newString += '</li>';
        if (next.intervalMileage <= 24999) {
          maintenanceToDo.firstQuarter.push(newString);
        } else if (next.intervalMileage <= 49999) {
          maintenanceToDo.secondQuarter.push(newString);
        } else if (next.intervalMileage <= 74999) {
          maintenanceToDo.thirdQuarter.push(newString);
        } else if (next.intervalMileage <= 99999) {
          maintenanceToDo.fourthQuarter.push(newString);
        } else {
          maintenanceToDo.greater.push(newString);
        }
      }
    });
    return maintenanceToDo;
  }

  function createMainHTMLString(data) {
    var newHTML = 'Nothing yet';
    return newHTML;
  }

  function initializeStore() {
    // console.log('Store before clear:', STORE);
    STORE = {
      error: false,
      laborCost: 0,
      year: null,
      make: null,
      model: null,
      models: [],
      style: null,
      styles: [],
      engine: null,
      engines: [],
      transmission: null,
      transmissions: [],
      mileage: null,
      zip: null,
      actionRepo: []
    }
  }

  function allSpecsPresent() {
    // console.log('STORE', STORE);

    if (
      STORE.year &&
      STORE.make &&
      STORE.model &&
      STORE.style &&
      STORE.engine &&
      STORE.transmission &&
      (STORE.mileage >= 0) &&
      (STORE.zip > 0) &&
      (STORE.zip.toString().length === 5)
    ) {
      return true;
    }
    return false;
  }

  function createHeaderName() {
    var headerProps = [
      STORE.year,
      STORE.make.name,
      STORE.model.name,
      STORE.style.name,
      STORE.mileage + ' miles'
    ];

    return headerProps.join(' ');
  }

  function createYearList() {
    var year = 1990; // start year for list
    var years = [];

    var nextYear = new Date().getFullYear() + 1;
    while (year <= nextYear) {
      years.push(year);
      year++;
    }

    return years;
  }

  function loadData() {
    var urlForRequest = VEHICLE_API_URL + 'makes?' + DATA_TYPE_AND_KEY;
    // console.log('Retrieving all car makes and models.');
    $.get(urlForRequest).success(function(data) {
      sortDataAndPrimeSelectors(data);
      document.getElementById('yearSelector').disabled = false; //enable
    });
  };

  function sortDataAndPrimeSelectors(data) {

    // Go thru all the data on makes and models and create an array of years
    // the models were made (attach to model object) and create an array of
    // years the make had models
    ALL_MAKES = data.makes.map(function(nextMake) {
      nextMake.makeYears = [];

      nextMake.models.map(function(nextModel) {

        nextModel.modelYears = [];

        nextModel.years.map(function(nextYear) {
          if ($.inArray(nextYear.year, nextModel.modelYears) === -1) {
            nextModel.modelYears.push(nextYear.year);
          }
          if ($.inArray(nextYear.year, nextMake.makeYears) === -1) {
            nextMake.makeYears.push(nextYear.year);
          }
        });
      });
      return nextMake;
    });
  };

  // changeDepth is at which level the change was made
  function clearSelects(changeDepth) {

    // Clear transmission selection
    setSelect([], '', '', 'transmissionSelector', 'Select Transmission');
    document.getElementById('transmissionSelector').disabled = true;
    if (changeDepth === 'engine') { return 'engine'; }

    // Clear engine selection
    setSelect([], '', '', 'engineSelector', 'Select Engine');
    document.getElementById('engineSelector').disabled = true;
    if (changeDepth === 'trim') { return 'trim'; }

    setSelect([], '', '', 'trimSelector', 'Select Trim');
    document.getElementById('trimSelector').disabled = true;
    if (changeDepth === 'model') { return 'model'; }

    setSelect([], '', '', 'modelSelector', 'Select Model');
    document.getElementById('modelSelector').disabled = true;
    if (changeDepth === 'make') { return 'make'; }

    setSelect([], '', '', 'makeSelector', 'Select Make');
    document.getElementById('makeSelector').disabled = true;
    if (changeDepth === 'year') { return 'year'; }

    // if changeDepth does not match any of those values, clear year as well
    setSelect(RANGE_YEARS, null, null, 'yearSelector', 'Select Year');

    document.getElementById('mileageInput').value = '';
    document.getElementById('zipInput').value = '';

    document.getElementById('responseContent').innerHTML =
      '<h4><i>Please make your vehicle specification selections<i></h4>';
  }

  function setEngineSelect(selections, selectorID, placeholder) {

    var placeholder = '<option value="" disabled selected> ' + placeholder + ' </option>';
    var options = [placeholder];

    selections.forEach(function(next) {

      var nameString = next.cylinder + ' Cyl ' + next.size + ' Liter';

      var newMakeOption = '<option value="' + next.id + '"> ' + nameString + ' </option>';
      options.push(newMakeOption);
    });
    var select = document.getElementById(selectorID);
    select.innerHTML = options.join('\n');

  };

  function setSelect(selections, valueKey, nameKey, selectorID, placeholder) {

    var placeholder = '<option value="" disabled selected> ' + placeholder + ' </option>';
    var options = [placeholder];

    selections.forEach(function(next) {
      var nextKey = next;
      var nextName = next;

      if (valueKey) {
        nextKey = next[valueKey];
      }

      if (nameKey) {
        nextName = next[nameKey];
      }

      var newMakeOption = '<option value="' + nextKey + '"> ' + nextName + ' </option>';
      options.push(newMakeOption);
    });
    var select = document.getElementById(selectorID);
    select.innerHTML = options.join('\n');
  };
});
