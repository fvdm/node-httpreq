const dotest = require ('dotest');
const http = require ('http');
const app = require ('.');


// Test config
let config = {
  url: '',
  dlpath: './test.dat'
};


// Local webserver
const server = http.createServer ();

server.on ('request', (req, res) => {
  let data = [];

  req.on ('data', ch => {
    data.push (ch);
  });

  req.on ('end', () => {
    let body = 'ok';
    let code = 200;
    let type = 'text/plain';

    data = data.toString ('utf8');

    switch (req.url) {
      case '/timeout':
        setTimeout (() => {
          // just wait longer then 1 ms
        }, 10);
        break;

      case '/options-body':
        body = data;
        break;

      default:
        break;
    }

    res.writeHead (code, {
      'Content-Type': type,
      'Content-Length': body.length
    });

    res.end (body);
  });
});


// Common checks
function testResponse (test, err, data) {
  const headers = data && data.headers;

  test (err)
    .isObject ('fail', 'data', data)
    .isObject ('fail', 'data.headers', headers)
    .isNotEmpty ('fail', 'data.headers.content-length', headers && headers['content-length'])
    .isNotEmpty ('fail', 'data.headers.content-type', headers && headers['content-type'])
    .isExactly ('fail', 'data.statusCode', data && data.statusCode, 200)
    .isString ('fail', 'data.body', data && data.body)
    .isNotEmpty ('fail', 'data.body', data && data.body)
    .isArray ('fail', 'data.cookies', data && data.cookies)
    .done ();
}


// Module interface
dotest.add ('Interface', test => {
  test ()
    .isObject ('fail', 'exports', app)
    .isFunction ('fail', '.doRequest', app && app.doRequest)
    .isFunction ('fail', '.get', app && app.get)
    .isFunction ('fail', '.options', app && app.options)
    .isFunction ('fail', '.post', app && app.post)
    .isFunction ('fail', '.put', app && app.put)
    .isFunction ('fail', '.patch', app && app.patch)
    .isFunction ('fail', '.delete', app && app.delete)
    .isFunction ('fail', '.download', app && app.download)
    .isFunction ('fail', '.uploadFiles', app && app.uploadFiles)
    .done ();
});


// Method get()
dotest.add ('Method .get - with options', test => {
  const options = {
    timeout: 5000
  };

  app.get (config.url, options, (err, data) => {
    testResponse (test, err, data);
  });
});


dotest.add ('Method .get - without options', test => {
  app.get (config.url, (err, data) => {
    testResponse (test, err, data);
  });
});


// Method download()
dotest.add ('Method .download - with path', test => {
  app.download (config.url, config.dlpath, (err, data) => {
    const headers = data && data.headers;

    test (err)
      .isObject ('fail', 'data', data)
      .isObject ('fail', 'data.headers', headers)
      .isNotEmpty ('fail', 'data.headers.content-length', headers && headers['content-length'])
      .isExactly ('fail', 'data.statusCode', data && data.statusCode, 200)
      .isUndefined ('fail', 'data.body', data && data.body)
      .isArray ('fail', 'data.cookies', data && data.cookies)
      .done ();
    });
});


// Request options
dotest.add ('Request options - .body', test => {
  const options = {
    body: 'wacky wheels'
  };

  app.post (config.url + '/options-body', options, (err, data) => {
    test (err)
      .isExactly ('fail', 'data.body', data && data.body, 'wacky wheels')
      .done ();
  });
});


// Error: CANT_SEND_FILES_USING_GET
dotest.add ('Error: CANT_SEND_FILES_USING_GET', test => {
  const options = {
    files: [
      config.dlpath
    ]
  };

  app.get (config.url, options, (err, data) => {
    test ()
      .isError ('fail', 'err', err)
      .isExactly ('fail', 'err.code', err && err.code, 'CANT_SEND_FILES_USING_GET')
      .isString ('fail', 'err.message', err && err.message)
      .isNotEmpty ('fail', 'err.message', err && err.message)
      .isUndefined ('fail', 'data', data)
      .done ();
  })
});


// Error: TIMEOUT
dotest.add ('Error: TIMEOUT', test => {
  const options = {
    timeout: 1
  };

  app.get (config.url + '/timeout', options, (err, data) => {
    test ()
      .isError ('fail', 'err', err)
      .isExactly ('fail', 'err.code', err && err.code, 'TIMEOUT')
      .isString ('fail', 'err.message', err && err.message)
      .isNotEmpty ('fail', 'err.message', err && err.message)
      .isUndefined ('fail', 'data', data)
      .done ();
  });
});


// Start webserver on any available port and run the tests
server.listen (0, '127.0.0.1', () => {
  config.url = 'http://127.0.0.1:' + server.address().port;
  dotest.run ();
});
