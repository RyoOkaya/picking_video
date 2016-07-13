/*
 * モデル
 *
 */

var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/fd', 
    function(err) {
        if (err) {
            console.log(err);
        }
        else {
            console.log('connection success!');
        }
    });


var Positions = new mongoose.Schema({
    time: String,
    workerId: Number,
    Position_x: String,
    Position_y: String
});

exports.Positions = db.model('picking', Positions, 'picking');