var Connection = require('tedious').Connection;
var TYPES = require('tedious').TYPES;
var Request = require('tedious').Request;

var moment = require('moment-timezone');
moment().tz('America/Mexico_City');


//var json2csv = require('json2csv');

var azure = require('azure-storage');
var reporte = require ('./reporte.json');

//var sendgrid = require('sendgrid')('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');
//api key=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

/* var email     = new sendgrid.Email({
              to:       "carlos.munoz@alsea.com.mx",
              from:     'report_webjobs@vips.com.mx',
              bcc:       ['carlos.munoz@alsea.com.mx', 'elias.carrillo@alsea.com.mx'],
              cc:       cc_soporte,
              subject:  store.fiidtienda+' '+ store.fcnombre +':Tableta VIPS ISA sin enviar datos en más de 2 Días',
              text:     'Atencion ' + store.fiidtienda + ' ' + store.fcnombre + '\n Favor de levantar su ticket a la mesa de servicios de Alsea ya que la tableta de VIPS ISA en su unidad no ha enviado datos en más de 2 días \n Ultima fecha de Envío: ' + store.fdultimoenvio
            });
*/            

var nconf = require('nconf');
nconf.env()
     .file({ file: 'config.json', search: true });

var tableName = nconf.get("TABLE_NAME");
var partitionKey = nconf.get("PARTITION_KEY");
var accountName = nconf.get("STORAGE_NAME");
var accountKey = nconf.get("STORAGE_KEY");


var campos = ["FIIdTienda", "FCNombre", "FDFechaFin", "8069", "8070", "8071", "8072", "8073","8074","8075","8076","8077","8078"];


var sp = 'SPDetalleEncuestasFechas';
var ahora = moment().startOf('week').add(1,'days').format('YYYY-MM-DD');
var domingo_pasado = moment().startOf('week').subtract(6,'days').format('YYYY-MM-DD');


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

md5Archivo('reporteisa.csv');

connection.on('connect', function(err){
  //if no error inidcate that connection was succesful
  if(err)
    console.log("Hubo un error: "+ err);
    
    console.log("Conectando ...");
    
    var request = new Request(sp, function(err){
      if(err){
        console.log("Error en el request: "+err); 
        process.exit(1);
      }
      console.log("Generando Request...");
      
    });
    
    request.addParameter('pafechainicio',TYPES.Date, domingo_pasado);
    request.addParameter('pafechafin',TYPES.Date, ahora);
    
    
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
  
  var header = "Session_ID,Device_Name,¿Qué tan satisfecho está con el servicio en general?,¿El restaurante estaba limpio y en buenas condiciones?,¿Nuestro personal fue amable?,¿Los alimentos cumplieron sus expectativas de sabor y calidad?,¿Te atendimos con rapidez?,¿La experiencia que recibí vale lo que pagué?,¿Qué tan probable es que recomiende Vips a un amigo o familiar?,En General ¿Los precios del Vips son?,¿Cuál es tu Género?,¿Qué edad tienes?\r\n";
  
  csv = header;
  
  console.log("Organizando datos... solo falta poco");
  reporte.forEach(function(rows){
    var line ='';
    //stamp = rows.FDFechaFin.split('T');
    //var fecha = stamp[0] +" "+stamp[1].split('.')[0];;
    
    //usando moment para deserializar fecha y ponerla en formato cadena
    var fecha = moment(rows.FDFechaFin).utc().format('YYYY-MM-DD HH:mm:ss');
    
    registro.Session_ID = fecha;
    registro.Device_Name= rows.FIIdTienda	+" "+ rows.FCNombre;
    registro['8069'] = rows['8069'] === null ? "NA" : rows['8069'];
    registro['8070'] = rows['8070'] === null ? "NA" : rows['8070'];
    registro['8071'] = rows['8071'] === null ? "NA" : rows['8071'];
    registro['8072'] = rows['8072'] === null ? "NA" : rows['8072'];
    registro['8073'] = rows['8073'] === null ? "NA" : rows['8073'];
    registro['8074'] = rows['8074'] === null ? "NA" : rows['8074'];
    registro['8075'] = rows['8075'] === null ? "NA" : rows['8075'];
    registro['8076'] = rows['8076'] === null ? "NA" : rows['8076'];
    registro['8077'] = rows['8077'] === null ? "NA" : genero[rows['8077']];
    registro['8078'] = rows['8078'] === null ? "NA" : edad[rows['8078']];
    
    //console.log(registro);
    line = registro.Session_ID +"," + registro.Device_Name +"," + registro['8069'] +"," + registro['8070'] +",";
    line += registro['8071'] +",";
    line += registro['8072'] +",";
    line += registro['8073'] +",";
    line += registro['8074'] +",";
    line += registro['8075'] +",";
    line += registro['8076'] +",";
    line += registro['8077'] +",";
    line += registro['8078'] +"\r\n";
    csv += line;
  });
  

  blobSvc.createBlockBlobFromText('isareporte', 'reporteisa_20160705.csv', csv, function(err, res, rep){
    if(err) console.log("Hubo un error" + err);
  
    if(rep.isSuccessful){
      md5Archivo('reporteisa.csv');
      console.log("Archivo Guardado Exitosamente");
    }
      
      
  });
}

function md5Archivo (nombreArchivo){
  var azure = require('azure-storage');
  var _ = require('underscore');

  var nconf = require('nconf');
  nconf.env()
      .file({ file: 'config.json', search: true });

  var accountName = nconf.get("STORAGE_NAME");
  var accountKey = nconf.get("STORAGE_KEY");
  var blobSvc = azure.createBlobService(accountName,accountKey);

  var nombres=[];


  blobSvc.listBlobsSegmented('isareporte',null,function(error, result, response){
    if(response.statusCode===200){
        //console.log(result.entries);
        var a = _.where(result.entries,{name:nombreArchivo});
        console.log(a[0].properties['content-md5']);
        return a;
    }
  });
}