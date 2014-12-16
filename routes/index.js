module.exports = function (app, nus) {
  var opts = app.get('opts');

  app.route('/').all(function (req, res) {
    res.redirect(301, "http://www.royalforkblog.com");
  });

  app.route('/api/v1/shorten')
    .post(function (req, res) {
      nus.shorten(req.body['long_url'], function (err, reply) {
        if (err) {
          sendResponse(res, err);
        } else if (reply) {
          reply.short_url = opts.url.replace(/\/$/, '') + '/' + reply.hash;
          sendResponse(res, 200, reply);
        } else {
          sendResponse(res, 500);
        }
      });
    });

  app.route('/api/v1/expand')
    .post(function (req, res) {
      nus.expand(req.body['short_url'], function (err, reply) {
        if (err) {
          sendResponse(res, err);
        } else if (reply) {
          sendResponse(res, 200, reply);
        } else {
          sendResponse(res, 500);
        }
      });
    });

  app.get(/^\/([\w=]+)$/, function (req, res, next){
    nus.expand(req.params[0], function (err, reply) {
      if (err) {
        next();
      } else {
        res.redirect(301, reply.long_url);
      }
    }, true);
  });

  /// catch 404 and forwarding to error handler
  app.use(function(req, res, next) {
      var err = new Error('Not Found');
      err.status = 404;
      next(err);
  });

  /// error handlers

  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('errors/404', {
        message: err.message,
        error: err
      });
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('errors/404', {
      message: err.message,
      error: {}
    });
  });
};

function sendResponse (res, code, data) {
  var status_codes = {
        200 : 'OK',
        300 : 'Incorrect Link',
        400 : 'Bad Request',
        404 : 'Not Found',
        500 : 'Internal Server Error',
        503 : 'Unknown Server Error'
      };

  res.type('application/json');

  data = data || {};

  data.status_code = (status_codes[code]) ? code : 503,
  data.status_txt = status_codes[code] || status_codes[503]

  res.json(data.status_code, data)
}
