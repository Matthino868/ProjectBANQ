const express = require('express');
const app = express();
const fs = require('fs');
const https = require('http');
// const https = require('https');
const messages = require('./messages.json')
const countrySchema = require('./countrySchema.json')
// const filepaths = require('../../../filepaths.json');
// const filepaths = require('../Keys');
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
* dstIP:	IP address of the target country.
* sendObj:	The request object that is to be passed on to the target country.
* apiMethod:	The API method to call on the target server. Equals the method called by source country.
* httpMethod: 	Which HTTP method is to be used. POST or GET probably.
* _callback:	Callback function to be executed when the response from the target country is received.
*/
async function sendRequest(dstIP, dstPort, sendObj, apiMethod, _callback) {
    const apiMethodStr = '/'.concat(apiMethod);
    const https_options = {
	host:	 	    dstIP,
	port: 		    dstPort,
	path: 		    apiMethodStr,
	method:		    'POST',
    headers:        { 'Content-Type': 'application/json' },
    cert: 		    opts.cert,
	key:            opts.key,
    rejectUnauthorized: false,
	timeout: 	    3000
    };

    try {
        const req = await https.request(https_options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (obj) => {
                console.log('asdf2');
                console.log(obj);
                try {
                    const responseObj = JSON.parse(obj);
                    console.log(responseObj);
                    console.log("2");
                    const resFromBank = responseObj['head']['fromBank'];
                    const resToBank = responseObj['head']['toBank'];
                    console.log("Response from [" + resFromBank + "]. Forwarding to [" + resToBank + "]");
                    _callback(true, res.statusCode, responseObj);
                }
                catch(e) {
                    const responseObj = JSON.parse(obj);
                    console.log(responseObj['status']);
                    _callback(false, responseObj['status'], "Er ging iets mis");
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


app.use(express.json())

app.get('/test', (req, res) => {
    console.log(r.noobTest.message);
    res.status(r.noobTest.code).send(r.noobTest.message);
});

app.post('/balance', (req, res) => {
    console.log("Er wordt een balans verzoek gestuurd")
    console.log(req.body)
    switch (req.body.head.toBank) {
        case MIFL:
            sendRequest('145.24.222.128', 80, req.body.body, "transaction/balance", function(success, code, result) {
                console.log(result);
                res.status(code).send(result);
            })
            break;
        case BANQ:
            sendRequest('145.24.222.71', 8443, req.body.body, "api/balance", function(success, code, result) {
                console.log(result);
                res.status(code).send(result);
            })
            break;
        case MFER:
            // sendRequest('145.24.222.128', 80, req.body.body, "transaction/balance", 'POST', function(success, code, result) {
            //     console.log(result);
            //     res.status(code).send(result);
            // })
            break;
        default:
            sendRequest('145.24.222.82', 8443, req.body.body, "api/balance", function(success, code, result) {
                console.log(result);
                res.status(code).send(result);
            })
            break;
    }

    sendRequest(countrySchema.re.body.head.a, req.body, "transaction/balance", function(success, code, result) {
        // const response = success ? result : result;
        console.log(result);
        res.status(code).send(result);
    });
});

app.post('/withdraw', (req, res) => {
    console.log("Er wordt een withdraw verzoek gestuurd");
    
});

console.log('de server is gestart');
https.createServer(opts, app).listen(8443);
