var express  = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port     = process.env.PORT || 80;

var SerialPort = require("serialport").SerialPort;
var serialPort = new SerialPort("/dev/ttyACM0", {
  baudrate: 9600
});

var serialDataOut = '9';

serialPort.on("open", function () {
  console.log('serialport open');
});

//bobby's custom code library
var qparse = require('./lib/qparse.js');

app.configure(function() {
        console.log("trying to configure app...");
        // set up our express application
        app.use(express.logger('dev')); // log every request to the console
        app.use(express.cookieParser()); // read cookies (needed for auth)
        app.use(express.bodyParser()); // get information from html forms

    app.set('views', __dirname + '/views'); //overwrite the default /views location
        app.set('view engine', 'ejs'); // set up ejs for templating
    app.use('/public', express.static(__dirname + "/public"));

    console.log(__dirname);
        // required for passport
        app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session se$
        console.log("done configuring app...");
});

// routes ======================================================================
require('./routes/routes.js')(app); // load our routes and pass in our app and fully configur$


server.listen(80);
console.log('The magic happens on port ' + port);

io.sockets.on('connection', function (socket) {
  socket.emit('news', "hello from the server!");
  socket.on('voice data', function(data) {
    console.log(">> " + data);

    // determine what the Pi should do based on the voice data
    qparse.parse(data);

    // determine what code needs to be sent to the arduino
    serialDataOut = qparse.ReturnSerialCode(data);

    // write to the arduino if there is data to write
    if(serialDataOut !== null)  {
        serialPort.write(new Buffer(serialDataOut,'ascii'), function(err, results) {
            console.log('sent '+ serialDataOut);
            console.log('err ' + err);
            console.log('results ' + results);
        });
    }
  });
  socket.on('button data', function(btn) {
    console.log(">> " +btn);

    // determine what the Pi should do based on the btn press
    qparse.parse(btn);

    // determine what code needs to be sent to the arduino
    serialDataOut = qparse.ReturnSerialCode(btn);
    
   // write to the arduino if there is data to write
  if(serialDataOut !== null)  {
        serialPort.write(new Buffer(serialDataOut,'ascii'), function(err, results) {
            console.log('sent '+ serialDataOut);
            console.log('err ' + err);
            console.log('results ' + results);
        });
    }
  });
  socket.on('status', function(status) {
    console.log(">> " + status);
  });
});

