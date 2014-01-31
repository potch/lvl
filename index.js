var level = require('level');
var Promise = require('es6-promise').Promise;

function avow(fn) {
  var p = promise();
  fn.call(this, p.fulfill, p.reject);
  return {then: p.then};
}

module.exports = function(path) {
  var db = level(path);

  function get(key) {
    return new Promise(function(resolve, reject) {
      db.get(key, function(err, value) {
        if (err) return reject(err);
        resolve(value);
      });
    });
  }

  function getObj(key) {
    return new Promise(function(resolve, reject) {
      get(key).then(function(value) {
        try {
          resolve(JSON.parse(value));
        } catch (e) {
          reject(e);
        }
      }, reject);
    });
  }

  function put(key, value) {
    return new Promise(function(resolve, reject) {
      db.put(key, value, function(err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  function putObj(key, value) {
    value = JSON.stringify(value);
    return put(key, value);
  }

  function getGroup(prefix) {
    return new Promise(function(resolve, reject) {
      var group = [];
      prefix = prefix + '-';
      var stream = db.createReadStream({
        'start': prefix
      }).on('data', function (data) {
          if (data.key.indexOf(prefix) !== 0) {
            stream.destroy();
          } else {
            group.push(data);
          }
        })
        .on('error', function (err) {
          reject(err);
        })
        .on('close', function () {
          resolve(group);
        })
        .on('end', function () {
          resolve(group);
        });
    });
  }

  function putGroup(prefix, value) {
    return new Promise(function (resolve, reject) {
      var lenKey = prefix + '.length';
      value = (typeof value === 'string') ? value : JSON.stringify('value');

      get(lenKey).then(function (val) {
        var len = parseInt(val, 10);
        len = len > 0 ? len + 1 : 1;
        writeRow(len);
      }, function (err) {
        writeRow(0);
      });

      function writeRow(len) {
        var rowKey = prefix + '-' + len;
        db.batch([
          { type: 'put', key: lenKey, value: len },
          { type: 'put', key: rowKey, value: value }
        ], function (err) {
          if (err) {
            reject('error writing row ' + err);
          } else {
            resolve();
          }
        });
      }
    });
  }

  return {
    get: get,
    getObj: getObj,
    getGroup: getGroup,
    put: put,
    putObj: putObj,
    putGroup: putGroup
  }

}