// サーバの処理
const http = require('http');
const express = require('express');
const path = require('path');
const router = express();
const server = http.createServer(router);

// router.use(express.static(path.resolve(__dirname, 'floorplan')));
router.use(express.static(path.resolve(__dirname, '')));

server.listen(process.env.PORT || 8080, function() {
    var addr = server.address();
    console.log("server listening at", addr.address + ":" + addr.port);
});

// server.listen(process.env.PORT, process.env.IP);
// console.log("server listening at", process.env.IP + ":" + process.env.PORT);

const url = require('url');
const workerIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 18, 19];

// 開始時刻, 終了時刻からデータを取得する
router.get('/getJsonByTime', function(req, res) {
    //時間計測
    var start_time = new Date().getTime();
    var result;
    const url_parts = url.parse(req.url, true);
    const query = url_parts.query;
    console.log("[DEBUG] Time from " + query.from_time + " to " + query.to_time);

    // Mongoからデータを取得する
    // getDocsFromMongo(query.from_time, query.to_time, function(err, data) {
    // Sqlite3からデータを取得する
    getDataFromSqlite3(query.from_time, query.to_time, function(err, data) {
        if (err) {
            console.log(err);
            res.send("error", {
                'Content-Type': 'application/json'
            }, 500);
            return;
        }
        //クエリの経過時間計測
        const query_time = new Date().getTime();
        console.log("DB query time: " + (query_time - start_time).toString() + " msec");
        // console.log(data);
        result = {
                message: "",
                data: data
            }
        // 結果応答
        res.setHeader('Access-Control-Allow-Origin', "*");
        res.json(result);
        //時間計測
        const server_time = 　new Date().getTime();
        // console.log("MongoDB End Time: " + new Date().toString());
        console.log("Server side total time: " + (server_time - start_time).toString() + " msec");
    });
});

//sqlite3からデータを取得する
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./db/picking_data.sqlite3', 'sqlite3.OPEN_READONLY');

// 1行ずつ整形して返す
function getDataFromSqlite3(from_time, to_time, callback) {
    // var data = []
    var time = [];
    var Position_x = [];
    var Position_y = [];

    // それぞれのworkerIdについてSQL文を回す
    // workerIds.forEach(function(workerId) {
    db.serialize(function() {
        var data = [];
        var date = '2016/2/17';
        var workerId = 15;
        db.each(
            "SELECT date, time, workerId, Position_x, Position_y FROM PICKING WHERE Position_x <> '' and workerId = ? and date = ? and time between ? and ?", [workerId, date, from_time, to_time],
            // 各行の取得時に呼び出される関数
            function(err, row) {
                data.push({
                    time: row.time,
                    Position_x: row.Position_x,
                    Position_y: row.Position_y
                })
                // time.push(row.time);
                // Position_x.push(row.Position_x);
                // Position_y.push(row.Position_y);
            },
            // 全行取得完了後に呼び出される関数
            function(err, rownum) {
                // data.push({
                //     time: time,
                //     x: Position_x,
                //     y: Position_y
                // });
                console.log("number of rows: " + rownum + " rows");
                callback(err, data);
            }
        );
        // });
    });
}

// Mongoからデータを全行取得して整形して返す
const model = require('./model/model.js');
const Pickings = model.Pickings;
function getDocsFromMongo(from_time, to_time, callback) {
    // var input_date = '2016/2/17';
    Pickings.find({
            'Position_x': {
                $ne: ""
            },
            // 'date' : input_date, // "2016-02-17"の日時のデータしかないため省略
            'time': {
                $gte: from_time,
                $lte: to_time
            }
        },
        function(err, docs) {
            prepareData(docs, function(data) {
                callback(err, data);
            });
        });
}

// Mongoのクエリの取得結果(docs)を整形して返す
function prepareData(docs, callback) {
    var data = [];
    var time = [];
    var Position_x = [];
    var Position_y = [];

    docs.forEach(function(row) {
        time.push(row.time);
        Position_x.push(row.Position_x);
        Position_y.push(row.Position_y);
    });

    data.push({
        time: time,
        x: Position_x,
        y: Position_y
    });

    callback(data);
}


//座標情報を持ったワーカーのIDを取得する(ハードコーディングしてるから使ってない)
// function getWorkerIds(callback) {
//     db.serialize(function() {
//         var workerIds = [];
//         db.each(
//             "select distinct workerId from PICKING WHERE Position_x <> ''",
//             // 各行の取得時に呼び出される関数
//             function(err, row) {
//                 workerIds.push(row);
//             },
//             // 全行取得完了後に呼び出される関数
//             function(err, rownum) {
//                 console.log("workerIds: " + workerIds);
//                 callback(err, workerIds);
//             }
//         );
//     });
// }

// 全行取得(使ってない)
// function getRowsFromSqlite3(from_time, to_time, callback) {
//     db.serialize(function() {
//         var date = '2016/2/17';
//         db.all(
//             "SELECT date, time, workerId, Position_x, Position_y FROM PICKING WHERE Position_x IS NOT NULL and date = ? and time between ? and ?", [date, from_time, to_time],
//             function(err, rows) {
//                 callback(rows);
//             }
//         )
//     })
// }




// socket.ioの処理
const io = require('socket.io')(server);

io.on('connection', function(socket) {
    // for debug of socket.io
    console.log('a user connected');

    // データをDBから取得して送信する
    socket.on('get_positions_by_time', function(time) {
        db.parallel(function() {
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
})