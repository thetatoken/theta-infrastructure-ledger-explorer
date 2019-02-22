var path = require('path');
var bodyParser = require('body-parser');
var express = require('express');
var webpack = require('webpack');
var config = require('./webpack.config.js');
var fs = require('fs');
let port = process.env.PORT || 443;


var app = express();
var compiler = webpack(config);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

/*
app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));

app.use(require('webpack-hot-middleware')(compiler));
*/


// healthy check from ELB 
app.get('/ping', function (req, res) {
  log.Info('Receive healthcheck /ping from ELB - ' + req.connection.remoteAddress);
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Length': 2
  });
  res.write('OK');
  res.end();
});



app.get('*', function (req, res) {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});



var privateKey = fs.readFileSync('./cert/star_thetatoken_org.key');
var certificate = fs.readFileSync('./cert/star_thetatoken_org.crt');
var options = {
  key: privateKey,
  cert: certificate
};
var https = require('https').createServer(options, app);


https.listen(port, function (err) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`Listening at {hostname}:${port}`);
});
