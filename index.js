var async = require('async');
var utils = require('utils');
var serand = require('serand');
var autils = require('autos-utils');
var Make = require('vehicle-makes-service');
var Model = require('vehicle-models-service');

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

var cdn = function (size, items, done) {
    if (!size) {
        return done();
    }
    items = items instanceof Array ? items : [items];
    async.each(items, function (item, did) {
        var photos = item.photos;
        if (!photos) {
            return did();
        }
        var o = [];
        async.each(photos, function (photo, pushed) {
            autils.cdn('images/' + size + '/' + photo, function (err, url) {
                if (err) {
                    return pushed(err);
                }
                o.push({
                    id: photo,
                    url: url
                });
                pushed();
            });
        }, function (err) {
            if (err) {
                return did(err);
            }
            item.photos = o;
            did();
        });
    }, done);
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
    cdn(options.images, vehicles, function (err) {
        if (err) {
            return done(err);
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
            });
        });
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
        error: function (xhr, status, err) {
            done(err || status || xhr);
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
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

exports.remove = function (options, done) {
    $.ajax({
        method: 'DELETE',
        url: utils.resolve('autos://apis/v/vehicles/' + options.id),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};
