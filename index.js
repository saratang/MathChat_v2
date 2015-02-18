var express = require("express");
var jade = require("jade");
var session = require("express-session");
var bodyParser = require("body-parser");
// var cookieParser = require("cookie-parser")();
// var session = require("cookie-session")({secret: 'secret'});
var app = express();
var port = 3700;
 
app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

app.use(session({secret: 'secret'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var sess;

app.get("/", function(req, res){
    sess=req.session;
    res.render("page");
});

app.post('/login',function(req,res){
	sess=req.session;
	//In this we are assigning email to sess.name variable.
	//name comes from HTML page.
    sess.user_sess = {};
    sess.user_sess.name=req.body.name;
    sess.user_sess.user_id = makeid();
    
    sess.global_sess = [];
    sess.global_sess.push(req.body.name);
    // sess.name = req.body.name;
    // sess.user_id = makeid();
    console.log(req);
	res.end('done');
});

app.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

app.use(express.static(__dirname + '/public'));

var io = require('socket.io').listen(app.listen(port));
console.log("Listening on port " + port);

io.sockets.on('connection', function (socket) {
    // socket.emit('server_message', { message: sess.name + ' entered the chatroom.' });
    // socket.on('disconnect', function() {
    // 	socket.emit('server_message', { message: sess.name + ' left the chatroom.' });
    // });
    socket.on('send', function (data) {
        io.sockets.emit('message', data);
    });
    socket.on('new_user', function () {
        io.sockets.emit('send_user_sess', sess);
        io.sockets.emit('send_global_sess', sess);
    });
    socket.on('enter', function() {
        io.sockets.emit('server_message', { message: sess.user_sess.name + ' entered the chatroom.'});
    });
    socket.on('exit', function (data) {
        io.sockets.emit('server_message', { message: sess.user_sess.name + ' left the chatroom.' });
    });
    socket.on('typing', function (data) {
        socket.broadcast.emit('typing_message', data);
    });
    socket.on('not_typing', function() {
        socket.broadcast.emit('remove_typing_message');
    });
});

//////////HELPER FUNCTIONS//////////////
function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
