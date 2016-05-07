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
    this.sent = 0;
    this.received = 0;
    this.state = 'Unknown';
    this.refreshState(ce);
    this.unactiveCnt = 0;
};

Connection.prototype.refreshState = function (ce) {
    const tcpStateMap = function (state, type) {
        if (state === 'Connecting') {
            switch (type) {
                case 11:
                case 10:
                case 15:
                case 26:
                case 27:
                case 31:
                    state = 'Established';
                    break;
                case 13:
                case 17:
                case 29:
                    state = 'Disconnecting';
                    break;
                default :
                    state = 'Connecting';
                    break;
            }
        } else if (state === 'Disconnecting') {
            switch (type) {
                case 12:
                case 16:
                case 28:
                case 29:
                    state = 'Connecting';
                    break;
                case 11:
                case 10:
                case 26:
                case 27:
                    state = 'Established';
                    break;
                default:
                    state = 'Disconnecting';
                    break;
            }
        } else if (state === 'Established') {
            switch (type) {
                case 13:
                case 29:
                case 17:
                    state = 'Disconnecting';
                    break;
                default:
                    state = 'Established';
                    break;
            }
        } else {
            switch (type) {
                case 12:
                case 16:
                case 28:
                case 32:
                    state = 'Connecting';
                    break;
                case 13:
                case 17:
                case 29:
                    state = 'Disconnecting';
                    break;
                case 11:
                case 10:
                case 26:
                case 27:
                    state = 'Established';
                    break;
                default:
                    break;
            }
        }
        return state;
    };
    const udpStateMap = function (state, type) {
        switch (type) {
            case 11:
            case 27:
                state = 'Receiving';
                break;
            case 10:
            case 26:
                state = 'Sending';
                break;
            default:
                state = 'Disconnecting';
                break;
        }
        return state;
    };
    const stateMap = {
        'TCP': tcpStateMap,
        'UDP': udpStateMap
    };
    this.state = stateMap[this.proto](this.state, ce.type);
    switch (ce.type) {
        case 10: case 26:
            this.sent += ce.size;
            break;
        case 11: case 27:
            this.received += ce.size;
    }
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
            this.items[i].refreshState(ce);
            this.items[i].unactiveCnt = 0;
            return;
        }
    }
    let c = new Connection(ce);
    this.items.unshift(c);
};

ConnList.prototype.removeUnactive = function () {
    for (let i = 0; i < this.items.length; ++i) {
        if (this.items[i].state === 'Disconnecting') {
            this.items.splice(i, 1);
            continue;
        }
        this.items[i].unactiveCnt++;
        if (this.items[i].proto === 'UDP' && this.items[i].unactiveCnt > 60) {
            this.items.splice(i, 1);

        } else if (this.items[i].proto === 'TCP' && this.items[i].unactiveCnt > 120) {
            this.items.splice(i, 1);
        }
    }
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

angular.module('TCPViewer', [])
    .controller('ListController', function ($scope) {
        var connTrace = new ConnTrace();
        connTrace.start();
        $scope.connections = connTrace.connList.items;
        $scope.works = "Works";
        setInterval(function () {
            connTrace.connList.removeUnactive();
            $scope.$apply();
        }, 1000);
    });


