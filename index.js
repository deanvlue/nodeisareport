var Connection = require('tedious').Connection;
var TYPES = require('tedious').TYPES;
var Request = require('tedious').Request;

var moment = require('moment');

var json2csv = require('json2csv');

var campos = ["FIIdTienda", "FCNombre", "FDFechaFin", "8033", "8034", "8035", "8036", "8037","8038","8039","8040"];


var sp = 'SPDetalleEncuestas';


var config = {
    userName: 'reportesti',
    password: 'Alsea.15',
    server: 'w2z7yuuxg2.database.windows.net',
 
    options: {
      encrypt:true, 
      database:'alsea-isa-prod',
      rowCollectionOnDone : true,
      connectionTimeout: 300000,
      requestTimeout: 3000000
    }
};

var connection = new Connection(config);
var reporte = [];
var ahora = moment();
var respuesta = {};
var i=0;

// json2csv({
//   data:dataTest,
//   fields: campos
// }, function(err, csv){
//   if(err) console.log(err);
  
//   console.log(csv);
// });

connection.on('connect', function(err){
  //if no error inidcate that connection was succesful
  if(err)
    console.log("Hubo un error: "+ err);
    
    var request = new Request(sp, function(err){
    if(err)
        console.log("Error en el request: "+err); 
    });
    
    request.on('doneProc', function(rowCount, more, rows){
       //console.log("Finalizando Proc");
    });
    
     request.on('doneInProc', function(rowCount, more, rows){
       //console.log("Finalizando In");
      reporte=[];
       //Para cada renglon
       rows.forEach(function(row){
         //Revisa Cada Columna
         row.forEach(function(column){
           //Deja solo las que necesitamos
            if(column.metadata.colName !='FIIdRegion' || column.metadata.colName !='FIIdDispositivo'){
            respuesta[column.metadata.colName]=column.value;
            }
         });
        reporte.push(respuesta);
        //console.log("insertando respuesta//////////////// :" + i++);
        //console.log(respuesta);
        respuesta = {};
       });
       // i++;
        //console.log("Generando reporte CSV");
        //Genera el Reporte en CSV
        //  json2csv({
        //  data:reporte,
        //  fields: campos
        // }, function(err, csv){
        //     if(err) console.log(err);
        //     console.log(csv);
        // });
      //console.log("Registros:" + rowCount);
      //console.log("Reporte:" +reporte.length);
      console.log(JSON.stringify(reporte));
      connection.close();
      process.exit(0);
    });
    connection.callProcedure(request);
});
