var moment = require('moment');

var ahora = moment().startOf('week').add(1,'days').format('YYYY-MM-DDT00:00:00');
var domingo_pasado = moment().startOf('week').subtract(6,'days').format('YYYY-MM-DDT00:00:00');
console.log(ahora);
console.log(domingo_pasado);
console.log(typeof(ahora));