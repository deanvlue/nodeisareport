var Connection = require('tedious').Connection;
var TYPES = require('tedious').TYPES;
var Request = require('tedious').Request;

var moment = require('moment');

//var json2csv = require('json2csv');

var azure = require('azure-storage');
var reporte = require ('./reporte.json');

var nconf = require('nconf');
nconf.env()
     .file({ file: 'config.json', search: true });

var tableName = nconf.get("TABLE_NAME");
var partitionKey = nconf.get("PARTITION_KEY");
var accountName = nconf.get("STORAGE_NAME");
var accountKey = nconf.get("STORAGE_KEY");


var campos = ["FIIdTienda", "FCNombre", "FDFechaFin", "8033", "8034", "8035", "8036", "8037","8038","8039","8040"];


var sp = 'SPDetalleEncuestasFechas';


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
    
    console.log("Conectando ...");
    
    var request = new Request(sp, function(err){
      if(err)
        console.log("Error en el request: "+err); 
        
      console.log("Generando Request...");
      
    });
    
    request.addParameter('pafechainicio',TYPES.VarChar,'2016-02-08');
    request.addParameter('pafechafin',TYPES.VarChar,'2016-02-15');
    
    
    request.on('doneProc', function(rowCount, more, rows){
       //console.log("Finalizando Proc");
    });
    
     request.on('doneInProc', function(rowCount, more, rows){
       console.log("SP ejecutado!");
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
        respuesta = {};
       });

      //console.log(JSON.stringify(reporte));
      
      console.log("Generando reporte");
      generaCSV(reporte);
      //checaReporte(reporte);
      connection.close();
      //process.exit(0);
    });
    connection.callProcedure(request);
});

function checaReporte(reporte){
  reporte.forEach(function(registro){
    console.log(registro);
  });
}


function generaCSV(reporte){
  
  var blobSvc = azure.createBlobService(accountName,accountKey);
  
  blobSvc.createContainerIfNotExists('isareporte', {publicAccessLevel : 'blob'} ,function(error, result, response){
    if(!error){
      
      //Se genera el container y permite acceso anonimo de lectura
      console.log("Ingresando a store!");
      
    }else{
      console.log("Hubo un error: "+ error);
    }
  });

  var registro = {};
  var genero = {
    1: "Hombre",
    2: "Mujer"
  }
  
  var edad = {
  6: "menos de 14",
  5: "15 a 24",
  4: "25 a 34",
  3: "35 a 48",
  2: "49 a 64",
  1: "65 o más"
  }
  
  var csv = "";
  
  var header = "Session_ID,Device_Name,¿Qué tan satisfecho está con el servicio en general?,¿El restaurante estaba limpio y en buenas condiciones?,¿Nuestro personal fue amable?,¿Los alimentos cumplieron sus expectativas de sabor y calidad?,¿Te atendimos con rapidez?,¿La experiencia que recibí vale lo que pagué?,¿Cuál es tu Género?,¿Qué edad tienes?\r\n";
  
  csv = header;
  
  console.log("Organizando datos... solo falta poco");
  reporte.forEach(function(rows){
    var line ='';
    //stamp = rows.FDFechaFin.split('T');
    //var fecha = stamp[0] +" "+stamp[1].split('.')[0];;
    
    //usando moment para deserializar fecha y ponerla en formato cadena
    var fecha = moment(rows.FDFechaFin).format( 'YYYY-MM-DD HH:mm:ss');
    
    registro.Session_ID = fecha;
    registro.Device_Name= rows.FIIdTienda	+" "+ rows.FCNombre;
    registro['8033'] = rows['8033'] === null ? "NA" : rows['8033'];
    registro['8034'] = rows['8034'] === null ? "NA" : rows['8034'];
    registro['8035'] = rows['8035'] === null ? "NA" : rows['8035'];
    registro['8036'] = rows['8036'] === null ? "NA" : rows['8036'];
    registro['8037'] = rows['8037'] === null ? "NA" : rows['8037'];
    registro['8038'] = rows['8038'] === null ? "NA" : rows['8038'];
    registro['8039'] = rows['8039'] === null ? "NA" : genero[rows['8039']];
    registro['8040'] = rows['8040'] === null ? "NA" : edad[rows['8040']];
    
    //console.log(registro);
    line = registro.Session_ID +"," + registro.Device_Name +"," + registro['8033'] +"," + registro['8034'] +",";
    line += registro['8035'] +",";
    line += registro['8036'] +",";
    line += registro['8037'] +",";
    line += registro['8038'] +",";
    line += registro['8039'] +",";
    line += registro['8040'] +"\r\n";
    csv += line;
  });
  

  blobSvc.createBlockBlobFromText('isareporte', 'reporteisafechas.csv', csv, function(err, res, rep){
    if(err) console.log("Hubo un error" + err);
  
    if(rep.isSuccessful)
      console.log("Archivo Guardado Exitosamente");
  });

}