"use strict";


var md5Archivo=function(nombreArchivo){
  var azure = require('azure-storage');
  var _ = require('underscore');

  var nconf = require('nconf');
  nconf.env()
      .file({ file: 'config.json', search: true });

  var accountName = nconf.get("STORAGE_NAME");
  var accountKey = nconf.get("STORAGE_KEY");
  var blobSvc = azure.createBlobService(accountName,accountKey);

  var nombres=[];

  //console.log(blobSvc);

  blobSvc.listBlobsSegmented('isareporte',null,function(error, result, response){
    if(response.statusCode===200){
        //console.log(result.entries);
        var a = _.where(result.entries,{name:nombreArchivo});
        console.log(a[0]);
    }
    
  });
  
  /*blobSvc.listBlobsSegmented('isareporte', null, function(error, result, response){
    return result;
  });*/
   /* if(!error){
      //console.log(result.entries);
      result.entries.forEach(function(f){
        if(f.name===nombreArchivo){
          md5Id=f.properties["content-md5"];
        }else{
          return '0';
        }
        return md5Id;
      });
        // result.entries contains the entries
        // If not all blobs were returned, result.continuationToken has the continuation token.
      return self.md5Id;
    }
    return "error";
  });

  return self.md5Id;*/
  return nombres;
};

md5Archivo('reporteisa.csv', function(archivo){
  console.log(archivo);
});

md5Archivo('reporteisa_20160705.csv', function(archivo){
  console.log(archivo);
});