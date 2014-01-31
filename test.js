var lvl = require('./index.js');
var db = lvl('test.db');

db.put('foo', 'bar').then(function () {
  console.log('put done');
  db.get('foo').then(console.log);
}, console.error);

db.putGroup('pfx', Date.now()).then(function () {
  console.log('putGroup done');
  db.getGroup('pfx').then(console.log);
}, console.error).catch(console.error);

db.putObj('o', { foo: 'bar' }).then(function () {
  db.getObj('o').then(console.log);
});
