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
    // ca: [fs.readFileSync(filepaths.noobRoot),
    //      fs.readFileSync(filepaths.noobCA)]
}
const optsHTTPS = {
    key: fs.readFileSync('./keys/country_key.pem'),
    cert: fs.readFileSync('./keys/mk_server_chain.pem'),
    requestCert: true,
    rejectUnauthorized: false,
    // ca: [fs.readFileSync(filepaths.noobRoot),
    //      fs.readFileSync(filepaths.noobCA)]
}

function handlePostRequest(req, res, retObj, foutcode) {
    if (!req.is('application/json')){
        console.log(r.expectedJSONError.message + wysd.sanityCheck)
        res.status(r.expectedJSONError.code).send(r.expectedJSONError.message + wysd.sanityCheck);
        return;
    }
    res.status(foutcode).json(retObj)
/*    if (req.client.authorized) {
        res.status(200).json(retObj)
    } else {
        console.log(r.invalidCertIssuer.message);
        res.status(r.unauthorized.code).send(r.unauthorized.message + wysd.seeLogs);
    }*/
}

/**
* async function sendRequest(dstIP, sendObj, apiMethod, _callback)
* Initiates HTTPS request to target country after receiving a request from source country.
* Async function with max timeout of 3 seconds. Assumes that everyone uses port 8443.
*
* dstIP:        IP address of the target country.
* sendObj:      The request object that is to be passed on to the target country.
* apiMethod:    The API method to call on the target server. Equals the method called by source country.
* httpMethod:   Which HTTP method is to be used. POST or GET probably.
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
        cert:           opts.cert,
        key:            opts.key,
        rejectUnauthorized: false,
        timeout:        3000
    };

    try {
        const req = await http.request(https_options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (obj) => {
                console.log('land7');
                console.log(obj);
                try {
                    const responseObj = JSON.parse(obj);
                    console.log(responseObj);
                    console.log("land8");
                    const resFromBank = responseObj['head']['fromBank'];
                    const resToBank = responseObj['head']['toBank'];
                    console.log("Response from [" + resFromBank + "]. Forwarding to [" + resToBank + "]");
                    _callback(true, 200, responseObj);
                    return;
                }
                catch(e) {
                    console.log(`error is ${e}`);
                    // console.log(res.);
                    // const responseObj = JSON.parse(obj);
                    console.log("land9");
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
            console.log('er ging iets mis')
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
* async function sendRequest(dstIP, sendObj, apiMethod, _callback)
* Initiates HTTPS request to target country after receiving a request from source country.
* Async function with max timeout of 3 seconds. Assumes that everyone uses port 8443.
*
* dstIP:        IP address of the target country.
* sendObj:      The request object that is to be passed on to the target country.
* apiMethod:    The API method to call on the target server. Equals the method called by source country.
* httpMethod:   Which HTTP method is to be used. POST or GET probably.
* _callback:    Callback function to be executed when the response from the target country is received.
*/
async function sendNOOBRequest(dstIP, dstPort, sendObj, apiMethod, _callback) {
    const apiMethodStr = '/'.concat(apiMethod);
    const https_options = {
        host:           dstIP,
        port:           dstPort,
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
                    console.log('Verstuurd object');
                    console.log(sendObj);
                    console.log('Ontvangen object na parsen');
                    console.log(responseObj);
                    const resFromBank = responseObj['head']['fromBank'];
                    const resToBank = responseObj['head']['toBank'];
                    console.log("Response from [" + resFromBank + "]. Forwarding to [" + resToBank + "]");
                    console.log(res.statusCode);
                    _callback(true, 200, responseObj);
                    return;
                }
                catch(e) {
                    console.log(`error is ${e}`);
                    console.log("land0");
                    console.log(res.statuscode);
                    console.log(r.jsonParseError.message + e.message);
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
            console.log('er ging iets mis')
            console.log(e.message);
            req.destroy();
            _callback(false, r.requestCompileError.code, r.requestCompileError.message + wysd.seeLogs);
        });
        console.log("land10");
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
    // console.log(req);
    switch (req.body.head.toBank) {
        case 'MIFL':
            sendHTTPRequest('145.24.222.128', 80, req.body, "transaction/balance", function(success, code, result) {
                const response = success ? JSON.stringify(result) : result;
                console.log(response);
                res.status(code).send(response);
            })
            break;
        case 'BANQ':
            console.log(req.statusCode);
            sendHTTPRequest('145.24.222.71', 8443, req.body, "api/balance", function(success, code, result) {
                const response = success ? JSON.stringify(result) : result;
                console.log('Response object');
                console.log(response);
                console.log(result);
                console.log(JSON.stringify(response));
                res.status(code).send(JSON.stringify(response));
            })
            break;
        case 'MFER':
            // sendRequest('145.24.222.128', 80, req.body.body, "transaction/balance", 'POST', function(success, code, result) {
            //     console.log(result);
            //     res.status(code).send(result);
            // })
            break;
        default:
            console.log("Verzoek naar de noob");
            sendNOOBRequest('145.24.222.82', 8443, req.body, "api/balance", function(success, code, result) {
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
            sendHTTPRequest('145.24.222.128', 80, req.body, "transaction/withdraw", function(success, code, result) {
                console.log("land1");
                console.log(result);
                res.status(code).send(result);
            })
            break;
        case 'BANQ':
            console.log(req.statusCode);
            sendHTTPRequest('145.24.222.71', 8443, req.body, "api/withdraw", function(success, code, result) {
                const response = success ? JSON.stringify(result) : result;
                console.log(response);
                res.status(code).send(response);
            })
            break;
        case 'MFER':
            // sendRequest('145.24.222.128', 80, req.body.body, "transaction/balance", 'POST', function(success, code, result) {
            //     console.log(result);
            //     res.status(code).send(result);
            // })
            break;
        default:
            console.log("Verzoek naar de noob");
            sendNOOBRequest('145.24.222.82', 8443, req.body, "api/withdraw", function(success, code, result) {
                console.log(result);
                res.status(code).send(result);
            })
            break;
    }
});

console.log('de server is gestart');
https.createServer(opts, app).listen(8443);
