/*
 * Mongoogse モデル
 *
 */

var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/fd', 
    function(err) {
        if (err) {
            console.log(err);
        }
        else {
            console.log('mongoose connection succeeded!');
        }
    });


// var Positions = new mongoose.Schema({
//     time: String,
//     workerId: Number,
//     Position_x: String,
//     Position_y: String
// });

// exports.Positions = db.model('picking', Positions, 'picking');

var Pickings = new mongoose.Schema({
    time: String,
    workerId: Number,
    activity: String,
    locationId: String,
    shelfId: String,
    shelfTray: String,
    itemId: String,
    itemNum: Number,
    activityNotes: String,
    Position_x: String,
    Position_y: String
});

exports.Pickings = db.model('picking', Pickings, 'picking');


