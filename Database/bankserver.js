const express = require('express');
const app = express();
const fs = require('fs');
const http = require('http');
const https = require('https');
const messages = require('./messages.json')
// const filepaths = require('../../../filepaths.json');
// const filepaths = require('../Keys');
const r = messages.noob;
const wysd = messages.wysd;
const mysql =  require('mysql');
var testresult = 600;

var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "Password01!",
  database: "test_database"
});


//HTTPS options
//Note that rejectUnauth is false in order to politely respond to invalid certs
const opts = {
   key: fs.readFileSync('./keys/country_key.pem'),
   cert: fs.readFileSync('./keys/mk-server-chain.pem'),
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
async function sendRequest(dstIP, sendObj, apiMethod, httpMethod, _callback) {
    const apiMethodStr = '/'.concat(apiMethod);
    const https_options = {
	host:	 	    dstIP,
	port: 		    8443,
	path: 		    apiMethodStr,
	method:		    httpMethod,
    headers:        { 'Content-Type': 'application/json' },
    cert: 		    opts.cert,
	key:            opts.key,
    rejectUnauthorized: false,
	timeout: 	    3000
    };

    try {
        const req = await http.request(https_options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (obj) => {
                console.log('asdf2');
                console.log(obj);
                try {
                    const responseObj = JSON.parse(obj);
                    console.log("2");
                    // const resFromBank = JSON.parse(responseObj).head.fromBank;
                    // const resToBank = sendObj.head.fromBank;
                    // writeLogs("Response from [" + resFromBank + "]. Forwarding to [" + resToBank + "]");
                    _callback(true, res.statusCode, responseObj);
                }
                catch(e) {
                    // writeLogs(r.jsonParseError.message + e.message);
                    _callback(false, r.jsonParseError.code, r.jsonParseError.message + wysd.seeLogs);
                }
            });
        });
        req.on('socket', function (socket) {
            socket.setTimeout(https_options.timeout);
            socket.on('timeout', function() {
                // writeLogs(r.timeoutError.message);
                req.destroy();
                _callback(false, r.timeoutError.code, r.timeoutError.message);
            });
        });
        req.on('error', (e) => {
            // writeLogs(r.requestCompileError.message + e.message);
            req.destroy();
            _callback(false, r.requestCompileError.code, r.requestCompileError.message + wysd.seeLogs);
        });
        req.write(JSON.stringify(sendObj));
        req.end();
    } catch(e) {
        // writeLogs(r.sendRequestError.message + e.message);
        _callback(false, r.sendRequestTLDR.code, r.sendRequestTLDR.message + wysd.blame);
    }
}


app.use(express.json())

app.get('/test', (req, res) => {
    console.log(r.noobTest.message);
    res.status(r.noobTest.code).send(r.noobTest.message);
});

app.post('/balance', (req, res) => {
    if(req.body.head.toCtry == 'MK' && req.body.head.toBank == 'BANQ'){
        con.query("SELECT COUNT(balans) AS rekeningnummer FROM test_tabel WHERE rekeningnummer = ? UNION ALL SELECT COUNT(rekeningnummer) FROM test_tabel WHERE rekeningnummer = ? AND pincode = ? UNION ALL SELECT balans FROM test_tabel WHERE rekeningnummer = ? AND pincode = ? UNION ALL SELECT pogingen FROM test_tabel WHERE rekeningnummer = ? AND pincode = ?;", [req.body.body.acctNo, req.body.body.acctNo, req.body.body.pin, req.body.body.acctNo, req.body.body.pin, req.body.body.acctNo, req.body.body.pin], function(err, result){
            console.log(result);
            if(result[0].rekeningnummer == 1){          // rekeningnummer bestaat
                if(result[1].rekeningnummer == 1){      // pincode is correct
                    if(result[2].rekeningnummer != 3){  // genoeg pogingen over
                        const retObj = JSON.stringify({
                            'head': {
                                'fromCtry': 'MK',
                                'fromBank': 'BANQ',
                                'toCtry': req.body.head.fromCtry,
                                'toBank': req.body.head.fromBank
                            },
                            'body': {
                                'acctNo': req.body.body.acctNo,
                                'amount': result[2].rekeningnummer
                            }
                        });
                        handlePostRequest(req, res, retObj, 200);
                    }
                    else{
                        res.status(403).send("Pas geblokkeerd");
                    }
                }
                else{
                    res.status(401).send("Incorrecte Pincode");
                    con.query("UPDATE test_tabel SET pogingen = pogingen + 1 WHERE rekeningnummer = ?;", [req.body.body.acctNo])
                }
            }
            else{
                res.status(404).send("Rekeningnummer bestaat niet");
            }
        });
    }
    else{
        // doorsturen
        // res.status(500).send("Er ging iets mis");
        console.log('asdf');
        // const https_options = {
        //     host:	 	    '145.24.222.71',
        //     port: 		    8443,
        //     path: 		    '/test',
        //     method:		    'GET',
        //     headers:        { 'Content-Type': 'application/json' },
        //     cert: 		    opts.cert,
        //     key:            opts.key,
        //     rejectUnauthorized: false,
        //     timeout: 	    3000
        // };
        // const req = http.request(https_options, res1 => {
        //     console.log(`statusCode: ${res.statusCode}`);
        //     res1.setEncoding('utf-8');
          
        //     res1.on('data', d => {
        //       // process.stdout.write(d);
        //       console.log('asdf4')
        //       console.log(d);
        //       res.status(200).send(d);
        //     });
        // });

        // req.on('error', error => {
        //     console.error(error);
        // });

        // req.end();

        sendRequest('145.24.222.71', req.body, "/test", 'GET', function(success, code, result) {
            console.log('asdf3');
		    const response = success ? JSON.parse(result) : result;
		    res.status(code).send(response);
	 	});
    }
});

app.post('/withdraw', (req, res) => {
    const retObj = JSON.stringify({
            'head': {
                'fromCtry': 'T1',
                'fromBank': 'TEST',
                'toCtry': req.body.head.fromCtry,
                'toBank': req.body.head.fromBank
            },
            'body': {
                'acctNo': req.body.body.acctNo,
                'success': true
            }
    });
    console.log('Incoming withdraw request');
    handlePostRequest(req, res, retObj);
});

console.log('de server is gestart');
http.createServer(opts, app).listen(8443);
// console.log('de server is gestart2');
