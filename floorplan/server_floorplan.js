// サーバの処理
const http = require('http');
const express = require('express');
const path = require('path');
const router = express();
const server = http.createServer(router);


// router.use(express.static(path.resolve(__dirname, 'floorplan')));
router.use(express.static(path.resolve(__dirname, '')));

// server.listen(process.env.PORT || 8080, function() {
//     var addr = server.address();
//     console.log("server listening at", addr.address + ":" + addr.port);
// });

server.listen(process.env.PORT, process.env.IP);
console.log("server listening at", process.env.IP + ":" + process.env.PORT);

const url = require('url');
const model = require('./model/model.js');
const Positions = model.Positions;

//座標情報を持ったワーカーのIDを取得する。
router.get('/workerIds', function(req, res) {
    Positions.find({
            'Position_x': {$ne:""}
        })
        .distinct('workerId',
        function(err, docs) {
            if (err) {
                console.log(err);
                res.send("error", {'Content-Type': 'application/json'}, 500);
                return;
            }
            //res.setHeader('Access-Control-Allow-Origin', req.protocol + '://' + req.headers.host + ":8080");
            res.setHeader('Access-Control-Allow-Origin', "*");
            res.json(docs);
        });
});

// workeridからx, y座標を取得する
router.get('/positions', function(req, res) {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    Positions.find({
            'Position_x': {$ne:""},
            'workerId' : query.workerId
        },
        function(err, docs) {
            if (err) {
                console.log(err);
                res.send("error", {
                    'Content-Type': 'application/json'
                }, 500);
                return;
            }
            console.log(docs.length);
            var result = {message: "", data:[]};
            for(var i = 0; i < docs.length; i++) {
                var p = { time: docs[i].time, workerId: docs[i].workerId
                , Position_x: docs[i].Position_x
                , Position_y: docs[i].Position_y};
                result.data.push(p);
            }
            
            //res.setHeader('Access-Control-Allow-Origin', req.protocol + '://' + req.headers.host);
            res.setHeader('Access-Control-Allow-Origin', "*");
            res.json(result);
        });
});


// socket.ioの処理
const io = require('socket.io')(server);
const db = 1;

io.on('connection', function(socket) {
    // for debug of socket.io
    console.log('a user connected');

    // データをDBから取得して送信する
    socket.on('get_positions_by_time', function(time) {
        db.serialize(function() {
            var data = [];
            var date = '2016/2/17';
            // var workerIds = [];

            // db.all(
            //     "SELECT DISTINCT workerId FROM PICKING",
            //     function(err, rows){
            //         rows.forEach(function(row){
            //           workerIds.push(row.workerId);
            //         })
            //     }
            // )
            // ワーカ数の数分繰り返す
            // for文を使うと非同期処理になってemitが先に実行されてバグる
            // for (var workerId = 1; workerId < 2; workerId++) {
            var workerId = 1;
            db.all(
                "SELECT date, time, workerId, Position_x, Position_y FROM PICKING WHERE date = ? and time between ? and ? and workerId = ?", [date, time.from, time.to, workerId],
                function(err, rows) {
                    // Plotly.js用のデータ整形処理
                    var Position_x = [];
                    var Position_y = [];
                    rows.forEach(function(row) {
                        Position_x.push(row.Position_x);
                        Position_y.push(row.Position_y);
                    });

                    data.push({
                        mode: 'scatter',
                        x: Position_x,
                        y: Position_y
                    });
                    //ワーカ位置データの送信
                    io.emit('draw', data);
                }
            )
        })
    })
});