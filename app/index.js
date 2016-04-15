'use strict'

window.$ = window.jQuery = require('../bower_components/jquery/dist/jquery.js');
const childProcess = require('child_process');
const readLine = require('readline');

const child = childProcess.spawn('../EventTrace/Debug/EventTrace.exe');
const rl = readLine.createInterface({input: child.stdout});
rl.on('line', (data) => {
    $('#info').html(['<strong>', data.split(' ').join('-'), '</strong>'].join(''));
});
