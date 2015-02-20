window.onload = function() {
    var online_users = [];
    var messages = [];
    var current_index;
    var socket = io.connect(window.location.origin || window.location.protocol + '//' + window.location.hostname + ':' + window.location.port);
    var field = document.getElementById("field");
    var sendButton = document.getElementById("send");
    var content = document.getElementById("chatbox");
    var blip = document.createElement("audio");
    blip.setAttribute('src', '/blip.wav');

    var sess;
    //var global_sess;

    function server_message(data) {
        if (logged_in(sess)) {
            messages.push(data);
            var html = '';
            var i = messages.length - 1;
            var id = makeid();

            html += '<div class="msgcontainer"><div class="serverbox" id="serverln_' + id + '">';
            html += '<div class="serverln text-center" id="servermsg_' + id + '"><i>' + messages[i].message + '</i></div></div></div>'; 
            
            $("#chatbox").append(html);
            blip.play();
        }
    }

    // function add_to_onlinebox(user_sess) {
    //     online_users.push(user_sess);
    //     var len = messages.length;
    //     var html = '';

    //     for (i=0; i<len; i++) {
    //         html += html += '<div class="online_user" id="online_user_' + online_users[i].user_id + '">' + online_users[i].name + '</div>';
    //     }
    //     $('#onlinebox').append(html);
    // }

    socket.on('server_message', function (data) {
        if(data.message) {
            server_message(data);
        } else {
            console.log("There is a problem:", data);
        }

        // server_message(d)

        if (data.user && data.user.user_id && data.user.name) {
            // add_to_onlinebox(data.user);
        }
        console.log(data);

        //MathJax.Hub.Queue(["Typset", MathJax.Hub, messages[i].message]);
        $("#chatbox").scrollTop($("#chatbox")[0].scrollHeight);
    });

    //If user unloads window (BUT WAIT THIS ALSO TAKES ACCOUNT OF REFRESHING)
    $(window).unload(function() {
        socket.emit('exit', {name: sess.name});
    });

    //If user logs out
    $("#logout").click(function() {
        //alert('clicked!');
        // socket.emit('exit', {name: sess.name});
        $.get("/logout", function() {
            window.location.href='/';
        });
    });

    function logged_in(sess) {
        if (typeof sess != 'undefined' && typeof sess.name != 'undefined') {
            // alert('sess and sess.name are defined');
            //$('#welcome').hide();
            //$('#chatroom').show();
            // $('#greeting p').append('<b>' + sess.name + '</b>.');
            //$('#online').append('<div>' + sess.name + '</div>');
            // socket.emit('enter');
            return true;
        }
        return false;
    }

    function get_user_sess (data) {
        sess = data.user_sess;
        // console.log(sess);
        if (logged_in(sess)) {
            $('#greeting p').append('<b>' + sess.name + '</b>.');
            socket.emit('enter', {name: sess.name});
        }
        socket.removeListener('send_user_sess', get_user_sess);
    }

    socket.on('send_user_sess', get_user_sess);
    socket.on('send_global_sess', function (data) {
        global_sess = data.global_sess;
        // console.log(global_sess);
    });
    socket.emit('new_user');

    //Checks if user is valid
    $('#enter').click(function() {
        var name = validate_name($('#name').val());
    });

    $('#name').keyup(function(e) {
        if (e.keyCode == 13) {
            var name = validate_name($('#name').val());
        }
    });

    socket.on('message', function (data) {
        if (logged_in(sess)) {
            if(data.message) {
                messages.push(data);
                var html = '';
                var i = messages.length - 1;
                current_index = i;

                if (i != 0 && messages[i-1].user_id == messages[i].user_id) {
                    // console.log(i);
                    html += '<div class="msgln text-center" id="msg_' + messages[i].id + '">' + messages[i].message + '</div>';

                    var j = i - 1;
                    while (!$("#msgbox_" + messages[j].id).length) {
                        j--;
                    }

                    $("#msgbox_" + messages[j].id).append(html);
                } else {
                //for(var i=0; i<messages.length; i++) {
                    console.log(i);
                    html += '<div class="msgcontainer"><div class="userbox text-center"><b>' + (messages[i].username ? messages[i].username : 'Server') + '</b></div>';
                    html += '<div class="msgbox" id="msgbox_' + messages[i].id + '">';
                    html += '<div class="msgln text-center" id="msg_' + messages[i].id + '">' + messages[i].message + '</div></div></div>';
                    $("#chatbox").append(html);
                }
                //}
                //$("#chatbox").append(html);
                blip.play();
                
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, messages[i].message]);
                $("#chatbox").scrollTop($("#chatbox")[0].scrollHeight);
            } else {
                console.log("There is a problem:", data);
            }
        }
    });

    $("#send").click(function() {
        if (field.value != '') {
            sendMessage();
        }
    });

    ///////*************************** BELOW ****************************///////
    ///////**************************** ARE *****************************///////
    ///////*************************** A LOT ****************************///////
    ///////**************************** OF ******************************///////
    ///////*************************** FIELD ****************************///////
    ///////************************** METHODS ***************************///////

    $("#typing span p").addClass("invisible");
    
    socket.on('typing_message', function(data) {
        $("#typing span p").html(data.user + " is typing...")
        .removeClass("invisible");
    });

    socket.on('remove_typing_message', function(data) {
        $("#typing span p").html("is typing...")
        .addClass("invisible");
    })

    // if (is_typing(field)) {
    //     socket.emit('typing', {user: sess.name});
    // } else {
    //     socket.emit('not_typing');
    // }


    $("#field").focusin(function() {
        if (this.value != '') {
            socket.emit('typing', {user: sess.name});
        }
    })
    
    .focusout(function() {
        socket.emit('not_typing');
        //$("#typing span").addClass("invisible");
    })

    .keyup(function(e) {
        //Typing should show "User is typing"
        if (this.value != '') {
            socket.emit('typing', {user: sess.name});
        }

        if (e.keyCode == 13 && !e.shiftKey) {
            if (field.value != '') {
                sendMessage();
            }
        }

        //Pushing Up should pull up last message
        if (e.keyCode == 38) {
            if (messages[current_index].user_id == sess.user_id) {
                this.value = messages[current_index].message;
            }

            if (current_index > 0) {
                do {
                    current_index--;
                    // console.log(current_index);
                } while (messages[current_index].user_id != sess.user_id && current_index > 0);
            }
        }

        //Pushing Down should go to "next" message
        if (e.keyCode == 40) {
            if (current_index < messages.length - 1) {
                do {
                    current_index++;
                    // console.log(current_index);
                } while (messages[current_index].user_id != sess.user_id && current_index < messages.length - 1);
            }
            
            if (messages[current_index].user_id == sess.user_id) {
                this.value = messages[current_index].message;
            }
        }
    })
    .keydown(function(e) {
        if (e.keyCode == 38) {
            return false;
        }

        var open_to_close = { "{": "}", "(": ")", "[": "]", "$": "$"};
        function delete_both_brackets(textarea) {
            var content = textarea.value;
            var caret = getCaret(textarea);
            // console.log('Caret: ' + caret);
            // console.log('Previous char: ' + content.substring(caret - 1, caret));
            // console.log('Next char: ' + content.substring(caret, caret + 1));
            for (var open in open_to_close) {
                if (open_to_close.hasOwnProperty(open) && content.substring(caret - 1, caret) == open && content.substring(caret, caret+1) == open_to_close[open]) {
                    textarea.value = content.substring(0, caret - 1) + content.substring(caret, content.length);
                    $('#field').setCaret(caret);
                    return false;
                }
            }
            // $('#field').setCaret(caret);
            // return false;
        }

        if (e.keyCode == 8) {
            delete_both_brackets(field);
        }
    })
    .keypress(function(e) {
        //Complete bracket
        console.log(e.keyCode);

        var open_to_close = {123: 125, 40: 41, 91: 93, 36: 36};
        var close_to_open = {125: 123, 41: 40, 93: 91};

        for (var open in open_to_close) {
            if (open_to_close.hasOwnProperty(open) && e.keyCode == open) {
                // console.log(open);
                complete_bracket(this, open_to_close[open]);
            }
        }

        for (var close in close_to_open) {
            if (e.keyCode == close) {
                prevent_close(this, close_to_open[close]);
            }
        }

        function complete_bracket(textarea, close) {
            // console.log(shift_open_to_closed[open]);
            var content = textarea.value;
            var caret = getCaret(textarea);
            // console.log(caret);
            textarea.value = content.substring(0, caret) + String.fromCharCode(close) + content.substring(caret, content.length);
            $('#field').setCaret(caret);
        }

        function prevent_close(textarea, open) {
            var content = textarea.value;
            var caret = getCaret(textarea);
            console.log(content.substring(caret - 1, caret));
            if (content.substring(caret - 1, caret) == String.fromCharCode(open)) {
                textarea.value = content.substring(0, caret) + content.substring(caret + 1, content.length);
                $('#field').setCaret(caret + 1);
                // return false;
            }
        }
    });

    function sendMessage() {
        // console.log('Before: ' + field.value);
        // console.log('Trimmed: ' + field.value.trim());
        var text = format(field.value.trim());
        // console.log('After: ' + text);
        socket.emit('send', { message: text, username: sess.name, id: makeid(), user_id: sess.user_id});
        field.value = "";
        socket.emit('not_typing');
        //$("#typing span").addClass("invisible");
    };

    //if click on math button
    $('.math-btn').click(function() {
        //alert('clicked on ' + $(this).attr("value") +'!');
        field.value += $(this).attr("value");
        field.focus();
    });
}

function is_typing(field) {
    $(this).focusin(function() {
        if (this.value != '') {
            return true;
        }
    }).focusout(function() {
        return false;
    }).keyup(function(e) {
        if (this.value != '') {
            return true;
        }
    })
}

function validate_name(username) {
    if (username == '') {
        alert('Name cannot be empty!');
    } else {
        $.post("/login",{name:username},function(data){        
            if(data==='done') {
                window.location.href="/";
            }
        });
    }
}

function format(message) {
    var text = autocomplete(message, "$$");
    text = autocomplete(text, "$");
    // text = escape_tags(text);
    return new_line(text);
}

function escape_tags(message) {
    return message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
}

function new_line(message) {
    return message.replace(/\n/,'<br />');
}

function autocomplete(message, identifier) {
    var count = 0;
    for (var i=0; i< message.length; i++) {
        var substring = "";
        for (var j=0; j<identifier.length; j++) {
            substring += message[i + j]
        }
        if (substring == identifier) {
            count++
        }
    }

    switch(count % 2) {
        case 1:
            message += identifier;
            break;
        default:
            break;
    }

    return message
}

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function getCaret(el) {
  if (el.selectionStart) {
     return el.selectionStart;
  } else if (document.selection) {
     el.focus();

   var r = document.selection.createRange();
   if (r == null) {
    return 0;
   }

    var re = el.createTextRange(),
    rc = re.duplicate();
    re.moveToBookmark(r.getBookmark());
    rc.setEndPoint('EndToStart', re);

    return rc.text.length;
  }  
  return 0;
}

$.fn.setCaret = function(start, end) {
    if(!end) end = start; 
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};