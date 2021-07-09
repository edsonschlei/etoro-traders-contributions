/**
 * Setting to load the configurations
 */
var _settings = {
  'configSheet' : 'configurations',
  'googleDriveFolder': 'Google Drive Folder',
  'traderSheetName': 'Sheet name'
};

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Or DocumentApp or FormApp.
  ui.createMenu('Etoro')
      .addItem('Update Traders Contritutions', 'updateTradersContributions')
      .addToUi();
}

/**
 * Get the configuration values from the configurations sheet.
 */
function getConfigurations() {
  let tradersContributions = SpreadsheetApp.getActive();
  let configSheet = tradersContributions.getSheetByName(_settings.configSheet);
  let values = configSheet.getDataRange().getValues();
  Logger.log(values);
  let configurations = {};
  values.forEach(row => {
    if (row[0] == _settings.googleDriveFolder) {
      configurations['folder'] = row[1];
    }
    if (row[0] == _settings.traderSheetName) {
      configurations['tradersSheet'] = row[1];
    }
  });
  return configurations;
}

/**
 * Update the defined Sheet with the values found in the defined Google Drive Folder.
 */
function updateTradersContributions() {
  let config = getConfigurations()
  let tradersContributions = SpreadsheetApp.getActive();
  let sheet = tradersContributions.getSheetByName(config.tradersSheet);
  let contributions = getTradersContributions(config);
  Logger.log(JSON.stringify(contributions.entries()));
  updateContributions(sheet, contributions)
}

/**
 * 
 */
function updateContributions(sheet, contributions) {
  let lines = contributions.size;
  let data = sheet.getRange(5,1,lines,15);
  Logger.log(data.getValues());
  
  let dataValues = data.getValues();
  dataValues.forEach((rows, row) => {
    rows.forEach((value, col) =>{
      dataValues[row][col] = '';
    });
  });

  
  let index = 0;
  contributions.forEach((months, traderName) => {
    Logger.log(traderName);
    dataValues[index][0] = traderName;
    months.forEach((monthValue, mounthIndex) => {
      let col = parseInt(mounthIndex) * 2 + 1;
      dataValues[index][col] = monthValue.profit;
      dataValues[index][col+1] = monthValue.fees; 
    })
    index++;
  });
  data.setValues(dataValues);
}

function getTradersContributions(config) {
  var sheets = DriveApp.getFolderById(config.folder).getFilesByType(MimeType.GOOGLE_SHEETS);
  var tradersValues = new Map();
  let stopCount = 0;
  while (sheets.hasNext()) {
    var file = sheets.next();
    Logger.log(file.getName());
    if (file.getName().startsWith('eToroAccount')) {

      let dayIndex = file.getName().indexOf('01-');
      Logger.log(dayIndex);
      let currentMonth = file.getName().substr(dayIndex + 3, 2);
      Logger.log(currentMonth);
      let month = parseInt(currentMonth); 
      Logger.log(month);
      
      var spreadsheet = SpreadsheetApp.open(file);
      var sheet = spreadsheet.getSheetByName('Closed Positions');
      Logger.log(sheet.getName());
      var values = sheet.getDataRange().getValues();
      Logger.log(values);

      values.forEach((items, index) => {
        if (index > 0) {
          var traderName = items[2];
          var profit = parseFloat(items[8]);
          var feesDividends = parseFloat(items[13]);
          if (!tradersValues.has(traderName)) {
            let monthValues = new Map();
            tradersValues.set(traderName, monthValues);
          } 
          let monthValues = tradersValues.get(traderName);

          if (!monthValues.has(currentMonth)) {
            let monthValue = {
              'name': traderName,
              'month': month,
              'profit': 0.0,
              'fees' : 0.0
            };
            monthValues.set(currentMonth, monthValue);
          }
          let monthValue = monthValues.get(currentMonth)
          monthValue.profit += profit;
          monthValue.fees += feesDividends;
          Logger.log(monthValue);
        }
      });
    }
  }
  return tradersValues;
}
