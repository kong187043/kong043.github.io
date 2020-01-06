//服务端建立连接
const express = require("express");
const app = express();
//设置静态文件，会默认找当前目录下的index.html文件当做访问的页面
app.use(express.static(__dirname));

//WebSocket是依赖HTTP协议进行握手的
const server = require('http').createServer(app);
const io = require('socket.io')(server);
//监听与客户端的连接事件
// io.on('connection',socket => {
//     console.log('服务端连接成功');
//     socket.on('message', msg => {
//         //服务端发送message事件,把msg消息再发送给客户端
//         //io.emit()方法向所有人广播
//         io.emit('message', {
//             user: '系统',
//             content: msg,
//             createAt: new Date().toLocaleString()
//         });
//     })
// })

//  这里要用server去监听端口，而非app.listen去监听(不然找不到socket.io.js文件)
server.listen(4433,'127.0.0.1',function(err){
    if(err){
        console.error(err);
    }else{
        console.info("服务器启动成功..");
    }
});


//把系统设置为常量，方便使用
const SYSTEM = "系统";

//用来保存对应的socket,就是记录对方的socket实例
let socketObj = {};

io.on('connection', socket => {
    console.log('服务端连接成功');
    //记录用户名,用来记录是不是第一次进入，默认是undefined
    let username;
    socket.on('message', msg => {
        //如果用户名存在
        if(username){
            //正则判断消息是否为私聊专属
            let private = msg.match(/@([^ ]+) (.+)/);
            if(private){ //私聊消息
                //私聊的用户，正则匹配的第一个分组
                let toUser = private[1];
                //私聊的内容，正则匹配的第二个分组
                let content = private[2];
                //从socketObj中获取私聊用户的socket
                let toSocket = socketObj[toUser];

                if(toSocket){
                    //向私聊的用户发消息
                    toSocket.send({
                        user: username,
                        content,
                        createAt: new Date().toLocaleString()
                    });
                }
            }else{ //公聊消息
                //就向所有人广播
                io.emit('message', {
                    user: username,
                    content: msg,
                    createAt: new Date().toLocaleString()
                })
            }

        } else { //用户名不存在的情况
            //如果是第一次进入的话，就将输入的内容当做用户名
            username = msg;
            // 向除了自己的所有人广播
            socket.broadcast.emit('message', {
                user: SYSTEM,
                content: `${username}加入了聊天! `,
                createAt: new Date().toLocaleString()
            });
        }
    })
})