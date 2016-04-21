'use strict'

window.$ = window.jQuery = require('../bower_components/jquery/dist/jquery.js');
const childProcess = require('child_process');
const readLine = require('readline');

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

Connection.prototype.refresh = function (ce) {
    this.sent += ce.size;
    this.received += ce.size;
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

ConnEvent.prototype.belongsTo = function (conn) {
    return this.pid === conn.pid &&
        this.proto === conn.proto &&
        this.saddr === conn.saddr &&
        this.sport === conn.sport &&
        this.daddr === conn.daddr &&
        this.dport === conn.dport;
};

var ConnList = function () {
    this.items = [];
};

ConnList.prototype.onConnEvent = function (ce) {
    for (let i = 0; i < this.items.length; ++i) {
        if (ce.belongsTo(this.items[i])) {
            this.items[i].refresh(ce);
            return;
        }
    }
    let c = new Connection(ce);
    this.items.push(c);
};

var ConnTrace = function () {
    this.traceSessionPath = '../EventTrace/Debug/StartTraceSession.exe';
    this.eventTracePath = '../EventTrace/Debug/EventTrace.exe';
    this.childProc = null;
    this.connList = new ConnList();
};

ConnTrace.prototype.start = function () {
    childProcess.spawnSync(this.traceSessionPath);
    this.childProc = childProcess.spawn(this.eventTracePath);
    const rl = readLine.createInterface({input: this.childProc.stdout});
    rl.on('line', (data) => {
        console.log(data);
        let jsonconn = JSON.parse(data);
        if (typeof jsonconn === 'object') {
            let ce = new ConnEvent(jsonconn);
            this.connList.onConnEvent(ce);
            // refreshConnListDisplay(this.connList.items);
        }
    });
};

ConnTrace.prototype.stop = function () {
    childProcess.spawn(this.traceSessionPath, ['close']);
    this.childProc.kill();
    this.childProc = null;
};




var connTrace = new ConnTrace();
var refreshing = false;

$('#start-trace').click(function () {
    connTrace.start();
    refreshing = true;
    refresh();
});

$('#stop-trace').click(function () {
    connTrace.stop();
    refreshing = false;
});

function refreshConnListDisplay(cnlist) {
    let $tbody = $("#conn-list");
    $tbody.html('');
    for (let i = 0; i < cnlist.length; ++i) {
        let $tr = $("<tr>");
        let $td = $("<td>").append(cnlist[i].pid);
        $tr.append($td);

        $td = $("<td>").append(cnlist[i].proto);
        $tr.append($td);

        $td = $("<td>").append([cnlist[i].saddr, ":", cnlist[i].sport].join(''));
        $tr.append($td);

        $td = $("<td>").append([cnlist[i].daddr, ":", cnlist[i].dport].join(''));
        $tr.append($td);

        $td = $("<td>").append(cnlist[i].state);
        $tr.append($td);

        $td = $("<td>").append(cnlist[i].sent);
        $tr.append($td);

        $td = $("<td>").append(cnlist[i].received);
        $tr.append($td);

        $tbody.append($tr);
    }
}

function refresh() {
    refreshConnListDisplay(connTrace.connList.items);
    if (refreshing)
        setTimeout(refresh, 1000);
}


