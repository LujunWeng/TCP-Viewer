'use strict'

window.$ = window.jQuery = require('../bower_components/jquery/dist/jquery.js');
const childProcess = require('child_process');
const readLine = require('readline');

const child = childProcess.spawn('../EventTrace/Debug/EventTrace.exe');
const rl = readLine.createInterface({input: child.stdout});

var Connection = function (conn) {
    this.pid = conn.PID;
    this.proto = conn.proto;
    this.saddr = conn.saddr;
    this.sport = conn.sport;
    this.daddr = conn.daddr;
    this.dport = conn.dport;
    this.sent = parseInt(conn.size);
    this.received = parseInt(conn.size);
    this.state = parseInt(conn.type);
};

Connection.prototype.generateRow = function() {

};

var connList = [];

rl.on('line', (data) => {
    let jsonconn = JSON.parse(data);
    if (jsonconn && typeof jsonconn === 'object') {
        let conn = new Connection(jsonconn);
        console.log(conn);
    }
});
