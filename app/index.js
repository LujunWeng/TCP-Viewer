'use strict'

window.$ = window.jQuery = require('../bower_components/jquery/dist/jquery.js');
const childProcess = require('child_process');
const readLine = require('readline');
const child = childProcess.spawn('../EventTrace/Debug/EventTrace.exe');
const rl = readLine.createInterface({input: child.stdout});

var Connection = function (ce) {
    this.pid = ce.pid;
    this.proto = ce.proto;
    this.saddr = ce.saddr;
    this.sport = ce.sport;
    this.daddr = ce.daddr;
    this.dport = ce.dport;
    this.sent = ce.size;
    this.received = ce.size;
    this.state = ce.type;
};

var ConnEvent = function (ce) {
    this.pid = parseInt(ce.PID);
    this.proto = ce.proto;
    this.saddr = ce.saddr;
    this.sport = ce.sport;
    this.daddr = ce.daddr;
    this.dport = ce.dport;
    this.size = parseInt(ce.size);
    this.type = parseInt(ce.type);
};

ConnEvent.prototype.belongsTo = function(conn) {
    return this.pid === conn.pid &&
           this.proto === conn.proto &&
           this.saddr === conn.saddr &&
           this.sport === conn.sport &&
           this.daddr === conn.daddr &&
           this.dport === conn.dport;
};

var connList = [];

rl.on('line', (data) => {
    console.log(data);
    let jsonconn = JSON.parse(data);
    if (typeof jsonconn === 'object') {
        let ce = new ConnEvent(jsonconn);
        console.log(ce);
    }
});
