var async = require('async');
var utils = require('utils');
var serand = require('serand');
var autils = require('autos-utils');
var Make = require('vehicle-make-service');
var Model = require('vehicle-model-service');

var query = function (options) {
    if (!options) {
        return '';
    }
    var data = {
        query: {}
    };
    var name;
    var value;
    for (name in options) {
        if (!options.hasOwnProperty(name)) {
            continue;
        }
        if (name === '_') {
            continue;
        }
        value = options[name];
        data.query[name] = value instanceof Array ? {$in: value} : value;
    }
    return '?data=' + JSON.stringify(data);
};

var cdn = function (size, items) {
    if (!items) {
        return autils.cdn('images/' + size + '/');
    }
    var o = items instanceof Array ? items : [items];
    o.forEach(function (item) {
        var photos = item.photos;
        if (!photos) {
            return;
        }
        var o = [];
        photos.forEach(function (photo) {
            o.push({
                id: photo,
                url: autils.cdn('images/' + size + '/' + photo)
            });
        });
        item.photos = o;
    });
    return items;
};

var makes = function (vehicles, done) {
    var o = vehicles instanceof Array ? vehicles : [vehicles];
    async.each(o, function (vehicle, updated) {
        Make.findOne(vehicle.make, function (err, make) {
            if (err) {
                return updated(err);
            }
            vehicle.make = make;
            updated();
        })
    }, function (err) {
        done(err, vehicles);
    });
};

var models = function (vehicles, done) {
    var o = vehicles instanceof Array ? vehicles : [vehicles];
    async.each(o, function (vehicle, updated) {
        Model.findOne(vehicle.model, function (err, model) {
            if (err) {
                return updated(err);
            }
            vehicle.model = model;
            updated();
        })
    }, function (err) {
        done(err, vehicles);
    });
};

var update = function (vehicles, options, done) {
    if (options.images) {
        cdn(options.images, vehicles);
    }
    makes(vehicles, function (err, vehicles) {
        if (err) {
            return done(err);
        }
        models(vehicles, function (err, vehicles) {
            if (err) {
                return done(err);
            }
            done(null, vehicles);
        })
    });
};

exports.findOne = function (options, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('autos://apis/v/vehicles/' + options.id),
        dataType: 'json',
        success: function (data) {
            update(data, options, done);
        },
        error: function () {
            done(new Error('error retrieving vehicle ' + options.id));
        }
    });
};

exports.find = function (options, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('autos://apis/v/vehicles' + query(options.query)),
        dataType: 'json',
        success: function (data) {
            update(data, options, done);
        },
        error: function () {
            done(new Error('error retrieving vehicles'));
        }
    });
};
