const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const http = require('http');
const messages = require('./messages.json');
const r = messages.noob;
const wysd = messages.wysd;


//HTTPS options
//Note that rejectUnauth is false in order to politely respond to invalid certs
const opts = {
key: fs.readFileSync('./keys/country_key.pem'),
cert: fs.readFileSync('./keys/mk_server_chain.pem'),
    requestCert: true,
    rejectUnauthorized: false,
}

/**
* async function sendHTTPRequest(dstIP, dstPort, sendObj, apiMethod, _callback)
* Initiates HTTP request to target country after receiving a request from source country.
* Async function with max timeout of 3 seconds. 
*
* dstIP:        IP address of the target country.
* dstPort:      Port of the target country.
* sendObj:      The request object that is to be passed on to the target country.
* apiMethod:    The API method to call on the target server. Equals the method called by source country.
* _callback:    Callback function to be executed when the response from the target country is received.
*/
async function sendHTTPRequest(dstIP, dstPort, sendObj, apiMethod, _callback) {
    const apiMethodStr = '/'.concat(apiMethod);
    const https_options = {
        host:           dstIP,
        port:           dstPort,
        path:           apiMethodStr,
        method:         'POST',
        headers:        { 'Content-Type': 'application/json' },
        rejectUnauthorized: false,
        timeout:        3000
    };

    try {
        const req = await http.request(https_options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (obj) => {
                console.log('Ontvangen object');
                console.log(res.statusCode);
                console.log(obj);
                try {
                    const responseObj = JSON.parse(obj);
                    console.log('Verstuurd object');
                    console.log(sendObj);
                    console.log('Ontvangen object na parsen');
                    console.log(responseObj);
                    const resFromBank = responseObj['head']['fromBank'];
                    const resToBank = responseObj['head']['toBank'];
                    console.log("Response from [" + resFromBank + "]. Forwarding to [" + resToBank + "]");
                    _callback(true, res.statusCode, responseObj);
                    return;
                }
                catch(e) {
                    console.log(`error is ${e}`);
                    console.log(res.statusCode);
                    _callback(false, res.statusCode, obj);
                }
            });
        });
        req.on('socket', function (socket) {
            socket.setTimeout(https_options.timeout);
            socket.on('timeout', function() {
                console.log(r.timeoutError.message);
                req.destroy();
                _callback(false, r.timeoutError.code, r.timeoutError.message);
            });
        });
        req.on('error', (e) => {
            console.log('Er ging iets mis')
            console.log(r.requestCompileError.message + e.message);
            req.destroy();
            _callback(false, r.requestCompileError.code, r.requestCompileError.message + wysd.seeLogs);
        });
        req.write(JSON.stringify(sendObj));
        req.end();
    } catch(e) {
        console.log(r.sendRequestError.message + e.message);
        _callback(false, r.sendRequestTLDR.code, r.sendRequestTLDR.message + wysd.blame);
    }
}


/**
* async function sendNOOBRequest(dstIP, dstPort, sendObj, apiMethod, _callback)
* Initiates HTTPS request to NOOB server after receiving a request from source country.
* Async function with max timeout of 3 seconds.
*
* dstIP:        IP address of the target country.
* sendObj:      The request object that is to be passed on to the target country.
* apiMethod:    The API method to call on the target server. Equals the method called by source country.
* _callback:    Callback function to be executed when the response from the target country is received.
*/
async function sendNOOBRequest(sendObj, apiMethod, _callback) {
    const apiMethodStr = '/'.concat(apiMethod);
    const https_options = {
        host:           '145.24.222.82',
        port:           8443,
        path:           apiMethodStr,
        method:         'POST',
        headers:        { 'Content-Type': 'application/json' },
        cert:           opts.cert,
        key:            opts.key,
        rejectUnauthorized: false,
        timeout:        3000
    };

    try {
        const req = await https.request(https_options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (obj) => {
                console.log('Ontvangen object');
                console.log(res.statusCode);
                console.log(obj);
                console.log(sendObj);
                try {
                    const responseObj = JSON.parse(obj);
                    console.log('Verstuurd object na parsen');
                    console.log(sendObj);
                    console.log('Ontvangen object na parsen');
                    console.log(responseObj);
                    const resFromBank = responseObj['head']['fromBank'];
                    const resToBank = responseObj['head']['toBank'];
                    console.log("Response from [" + resFromBank + "]. Forwarding to [" + resToBank + "]");
                    console.log(res.statusCode);
                    _callback(true, res.statusCode, responseObj);
                    return;
                }
                catch(e) {
                    console.log(`error is ${e}`);
                    console.log(res.statuscode);
                    console.log(e.message);
                    _callback(false, res.statusCode, obj);
                }
            });
        });
        req.on('socket', function (socket) {
            socket.setTimeout(https_options.timeout);
            socket.on('timeout', function() {
                console.log(r.timeoutError.message);
                req.destroy();
                _callback(false, r.timeoutError.code, r.timeoutError.message);
            });
        });
        req.on('error', (e) => {
            console.log('Er ging iets mis')
            console.log(e.message);
            req.destroy();
            _callback(false, r.requestCompileError.code, r.requestCompileError.message + wysd.seeLogs);
        });
        console.log("Verstuurd object");
        console.log(JSON.stringify(sendObj));
        req.write(JSON.stringify(sendObj));
        req.end();
    } catch(e) {
        console.log(r.sendRequestError.message + e.message);
        _callback(false, r.sendRequestTLDR.code, r.sendRequestTLDR.message + wysd.blame);
    }
}


app.use(express.json())

app.get('/test', (req, res) => {
    console.log(r.noobTest.message);
    res.status(r.noobTest.code).send(r.noobTest.message);
});

app.post('/balance', (req, res) => {
    console.log("Er wordt een balans verzoek gestuurd")
    console.log(req.body);
    switch (req.body.head.toBank) {
        case 'MIFL':
            console.log("Balance verzoek naar MIFL");
            sendHTTPRequest('145.24.222.128', 80, req.body, "transaction/balance", function(success, code, result) {
                const response = success ? JSON.stringify(result) : result;
                console.log(response);
                res.status(code).send(response);
            })
            break;
        case 'BANQ':
            console.log("Balance verzoek naar BANQ");
            sendHTTPRequest('145.24.222.71', 8443, req.body, "api/balance", function(success, code, result) {
                const response = success ? JSON.stringify(JSON.stringify(result)) : result;
                console.log('Response object');
                console.log(response);
                // console.log(result);
                // console.log(JSON.stringify(response));
                res.status(code).send(response);
            })
            break;
        case 'MFER':
            console.log("Balance verzoek naar MFER");
            sendHTTPRequest('145.24.222.160', 8000, req.body, "balance", 'POST', function(success, code, result) {
                const response = success ? JSON.stringify(result) : result;
                console.log(response);
                res.status(code).send(response);
            })
            break;
        default:
            console.log("Balance verzoek naar NOOB");
            sendNOOBRequest(req.body, "api/balance", function(success, code, result) {
                const response = success ? JSON.stringify(result) : result;
                console.log(response);
                res.status(code).send(response);
            })
            break;
    }
});

app.post('/withdraw', (req, res) => {
    console.log("Er wordt een withdraw verzoek gestuurd");
    switch (req.body.head.toBank) {
        case 'MIFL':
            console.log("Withdraw verzoek naar MIFL");
            sendHTTPRequest('145.24.222.128', 80, req.body, "transaction/withdraw", function(success, code, result) {
                console.log(result);
                res.status(code).send(result);
            })
            break;
        case 'BANQ':
            console.log("Withdraw verzoek naar BANQ");
            sendHTTPRequest('145.24.222.71', 8443, req.body, "api/withdraw", function(success, code, result) {
                const response = success ? JSON.stringify(JSON.stringify(result)) : result;
                console.log(response);
                res.status(code).send(response);
            })
            break;
        case 'MFER':
            console.log("Withdraw verzoek naar MFER");
            sendHTTPRequest('145.24.222.160', 8000, req.body, "withdraw", 'POST', function(success, code, result) {
                const response = success ? JSON.stringify(result) : result;
                console.log(response);
                res.status(code).send(JSON.stringify(response));
            })
            break;
        default:
            console.log("Withdraw verzoek naar NOOB");
            sendNOOBRequest(req.body, "api/withdraw", function(success, code, result) {
                const response = success ? JSON.stringify(result) : result;
                console.log(response);
                res.status(code).send(response);
            })
            break;
    }
});

console.log('De landserver is gestart');
https.createServer(opts, app).listen(8443);
