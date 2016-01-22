var Connection = require('tedious').Connection;
var TYPES = require('tedious').TYPES;
var Request = require('tedious').Request;

var moment = require('moment');



var sp = 'SPDetalleEncuestas';


var config = {
    userName: 'reportesti',
    password: 'Alsea.15',
    server: 'w2z7yuuxg2.database.windows.net',
    options: {encrypt:true, database:'alsea-isa-prod'}
};

var connection = new Connection(config);
var reporte = [];
var ahora = moment();

connection.on('connect', function(err){
  //if no error inidcate that connection was succesful
  if(err)
    console.log("Hubo un error: "+ err);
    
    var request = new Request(sp, function(err){
    if(err)
        console.log("Error en el request: "+err); 
    });
    
    request.on('row', function(columns){
       columns.forEach(function(column){
  
        
        if(column.metadata.colName !='FIIdRegion' || column.metadata.colName !='FIIdDispositivo'){
            console.log(column.metadata.colName + '|' + column.value);
         } 
        //console.log(column.metadata.colName + '|' + column.value);
       });
    });
    

    request.on('doneProc', function(rowCount, more){
       console.log("Finalizando");
       connection.close();

        
    });
    connection.callProcedure(request);
    
});
