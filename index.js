var express = require("express");
var jade = require("jade");
var session = require("express-session");
var bodyParser = require("body-parser");
// var cookieParser = require("cookie-parser")();
// var session = require("cookie-session")({secret: 'secret'});
var app = express();
// var port = process.env.PORT || 5000;

app.set('port', (process.env.PORT || 3700));
app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

app.use(session({secret: 'secret'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var sess;
var port = app.get('port');
var user_sessions = {};

app.get("/", function(req, res){
    sess=req.session;
    if (typeof sess.user_sess != 'undefined' && typeof sess.user_sess.private_id != 'undefined') {
        res.render("chatroom");
    } else {
        res.render("page");
    }
});

// app.get('/chatroom', function(req,res) {
//     sess=req.session;
// });



app.post('/login',function(req,res){
	sess=req.session;
	//In this we are assigning email to sess.name variable.
	//name comes from HTML page.
    sess.user_sess = {};
    sess.user_sess.name=req.body.name;
    sess.user_sess.private_id = make_id();
    sess.user_sess.public_id = make_id();
    user_sessions[sess.user_sess.private_id] = sess.user_sess; 

    sess.global_sess = [];
    sess.global_sess.push(req.body.name);
    // sess.name = req.body.name;
    // sess.user_id = make_id();
    // console.log(req);
	res.end(sess.user_sess.private_id);
});

// var name;
app.get('/logout', function(req, res) {
    // sess = req.session;
    // name = sess.user_sess.name;
    req.session.destroy(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

app.get('/user_sess', function(req, res) {
	res.end(JSON.stringify(req.session.user_sess));
});

app.use(express.static(__dirname + '/public'));

var io = require('socket.io').listen(app.listen(port));
console.log("Listening on port " + port);

io.sockets.on('connection', function (socket) {
    // socket.emit('server_message', { message: sess.name + ' entered the chatroom.' });
    // socket.on('disconnect', function () {
    // 	socket.emit('server_message', { message: name + ' left the chatroom.' });
    // });
    socket.on('send', function (data) {
        var private_id = data.private_id;
        for (var user in user_sessions) {
            if (user == private_id) {
                for (var prop in user_sessions[user]) {
                    if (prop == 'public_id') {
                        data.public_id = user_sessions[user][prop];
                    }
                }
            }
        }
        delete data.private_id;
        data.msg_id = make_id();
        data.msgbox_id = make_id();
        io.sockets.emit('message', data);
    });
    
    socket.on('enter', function (data) {
        console.log(data.name + ' entered.');
        var online_users = get_online_users(user_sessions);
        io.sockets.emit('server_message', { message: data.name + ' entered the chatroom.', id: make_id() });
        io.sockets.emit('update_users', {online: online_users});
    });
    socket.on('exit', function (data) {
        console.log(data.name + ' exited.');
        delete user_sessions[data.private_id];
        console.log(user_sessions);

        var online_users = get_online_users(user_sessions);
        console.log(online_users);

        io.sockets.emit('server_message', { message: data.name + ' left the chatroom.', id: make_id() });
        io.sockets.emit('update_users', {online: online_users});
    });
    socket.on('typing', function (data) {
        socket.broadcast.emit('typing_message', data);
    });
    socket.on('not_typing', function() {
        socket.broadcast.emit('remove_typing_message');
    });
});

//////////HELPER FUNCTIONS//////////////
function get_online_users(user_sessions) {
    var online_users = [];
    for (var user in user_sessions) {
        for (var prop in user_sessions[user]) {
            if (prop == 'name') {
                online_users.push(user_sessions[user][prop]);
            }
        }
    }
    return online_users;
}

function make_id()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function escape_tags(message) {
    return message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
}
