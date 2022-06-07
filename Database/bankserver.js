const express = require('express');
const app = express();
const fs = require('fs');
const http = require('http');
const https = require('https');
const messages = require('./messages.json')
const r = messages.noob;
const wysd = messages.wysd;
const mysql =  require('mysql');

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
   cert: fs.readFileSync('./keys/mk_server_chain.pem'),
    requestCert: true,
    rejectUnauthorized: false,
}

function handlePostRequest(req, res, retObj, foutcode) {
    if (!req.is('application/json')){
        console.log(r.expectedJSONError.message + wysd.sanityCheck)
        res.status(r.expectedJSONError.code).send(r.expectedJSONError.message + wysd.sanityCheck);
        return;
    }
    console.log("bank7");
    res.status(foutcode).json(retObj);
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
async function sendRequest(sendObj, apiMethod,  _callback) {
    const apiMethodStr = '/'.concat(apiMethod);
    const https_options = {
	host:	 	    "145.24.222.128",
	port: 		    8443,
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
                console.log('Ontvangen object');
                console.log(obj);
                try {
                    const responseObj = JSON.parse(obj);
                    console.log("Verstuurd object");
                    console.log(sendObj);
                    console.log("Ontvangen object na parsen");
                    console.log(responseObj);
                    const resFromBank = responseObj.head.fromBank;
                    const resToBank = sendObj.head.fromBank;
                    console.log("Response from [" + resFromBank + "]. Forwarding to [" + resToBank + "]");
                    _callback(true, res.statusCode, responseObj);
                }
                catch(e) {
                    console.log(r.jsonParseError.message + e.message);
                    _callback(false, res.statusCode, obj);
                }
            });
        });
        req.on('socket', function (socket) {
            socket.setTimeout(https_options.timeout);
            socket.on('timeout', function() {
                console.log("Bij socket ging het mis");
                console.log(r.timeoutError.message);
                req.destroy();
                _callback(false, r.timeoutError.code, r.timeoutError.message);
            });
        });
        req.on('error', (e) => {
            console.log("Bij error ging het mis");
            console.log(e.message);
            req.destroy();
            _callback(false, r.requestCompileError.code, r.requestCompileError.message + wysd.seeLogs);
        });
        req.write(JSON.stringify(sendObj));
        req.end();
    } catch(e) {
        console.log("Oops!");
        console.log(e.message);
        _callback(false, r.sendRequestTLDR.code, r.sendRequestTLDR.message + wysd.blame);
    }
}


app.use(express.json())

app.get('/test', (req, res) => {
    console.log(r.noobTest.message);
    res.status(r.noobTest.code).send(r.noobTest.message);
});

app.post('/api/balance', (req, res) => {
    console.log("Er wordt een balans verzoek gestuurd")
    if(req.body.head.toCtry == 'MK' && req.body.head.toBank == 'BANQ'){
        con.query("SELECT COUNT(balans) AS rekeningnummer FROM test_tabel WHERE rekeningnummer = ? UNION ALL SELECT COUNT(rekeningnummer)           FROM test_tabel WHERE rekeningnummer = ? AND pincode = ? UNION ALL SELECT pogingen FROM test_tabel WHERE rekeningnummer = ? UNION ALL SELECT balans FROM test_tabel WHERE rekeningnummer = ? AND pincode = ?;", [req.body.body.acctNo, req.body.body.acctNo, req.body.body.pin, req.body.body.acctNo, req.body.body.acctNo, req.body.body.pin], function(err, result){
            console.log(result);
            if(result[0].rekeningnummer == 1){          // rekeningnummer bestaat
                if(result[2].rekeningnummer < 3){          // genoeg pogingen over
                    if(result[1].rekeningnummer == 1){      // pincode is correct
                        const retObj = {
                            'head': {
                                'fromCtry': 'MK',
                                'fromBank': 'BANQ',
                                'toCtry': req.body.head.fromCtry,
                                'toBank': req.body.head.fromBank
                            },
                            'body': {
                                'acctNo': req.body.body.acctNo,
                                'balance': result[3].rekeningnummer
                            }
                        };
                        res.status(200).json(retObj);
                        // handlePostRequest(req, res, retObj, 200);
                    }
                    else{
                        // req.statusCode = 401;
                        res.status(401).send({
                            'head': {
                                'fromCtry': 'MK',
                                'fromBank': 'BANQ',
                                'toCtry': req.body.head.fromCtry,
                                'toBank': req.body.head.fromBank
                            },
                            'body':{
                                'attemptsLeft': 3 - result[2].rekeningnummer
                            }
                        });
                        // console.log(res);
                        con.query("UPDATE test_tabel SET pogingen = pogingen + 1 WHERE rekeningnummer = ?;", [req.body.body.acctNo])
                    }
                }
                else{
                    res.status(403).send("Pas geblokkeerd");
                }
            }
            else{
                res.status(404).send("Rekeningnummer bestaat niet");
            }
        });
    }
    else{
        console.log('bank1');
        console.log(req.body.head);
        sendRequest(req.body, "balance", function(success, code, result) {
            console.log('bank5');
            console.log(result);
		    res.status(code).send(result);
	 	});
    }
});

app.post('/api/withdraw', (req, res) => {
    console.log("Er wordt een withdraw verzoek gestuurd");
    if(req.body.head.toCtry == 'MK' && req.body.head.toBank == 'BANQ'){
        con.query("SELECT COUNT(balans) AS rekeningnummer FROM test_tabel WHERE rekeningnummer = ? UNION ALL SELECT COUNT(rekeningnummer)           FROM test_tabel WHERE rekeningnummer = ? AND pincode = ? UNION ALL SELECT pogingen FROM test_tabel WHERE rekeningnummer = ? UNION ALL SELECT balans FROM test_tabel WHERE rekeningnummer = ? AND pincode = ?;", [req.body.body.acctNo, req.body.body.acctNo, req.body.body.pin, req.body.body.acctNo, req.body.body.acctNo, req.body.body.pin], function(err, result){
            console.log(result);
            if(result[0].rekeningnummer == 1){      // rekeningnummer bestaat
                if(result[2].rekeningnummer < 30){       // genoeg pogingen over
                    if(result[1].rekeningnummer == 1){      // pincode is correct
                        if(result[3].rekeningnummer >= req.body.body.amount){
                            con.query("UPDATE test_tabel SET balans = balans - ? WHERE rekeningnummer = ?;", [req.body.body.amount, req.body.body.acctNo])
                            const retObj = {
                                'head': {
                                    'fromCtry': 'MK',
                                    'fromBank': 'BANQ',
                                    'toCtry': req.body.head.fromCtry,
                                    'toBank': req.body.head.fromBank
                                },
                                'body': {
                                    'success': true,
                                    'acctNo': req.body.body.acctNo,
                                    'balance': result[3].rekeningnummer
                                }
                            };
                            handlePostRequest(req, res, retObj, 200);
                        }
                        else{
                            const retObj = {
                                'head': {
                                    'fromCtry': 'MK',
                                    'fromBank': 'BANQ',
                                    'toCtry': req.body.head.fromCtry,
                                    'toBank': req.body.head.fromBank
                                },
                                'body': {
                                    'success': false,
                                    'acctNo': req.body.body.acctNo,
                                    'balance': result[3].rekeningnummer
                                }
                            };
                            handlePostRequest(req, res, retObj, 406);
                        }
                    }
                    else{
                        res.status(401).send("Incorrecte Pincode");
                        con.query("UPDATE test_tabel SET pogingen = pogingen + 1 WHERE rekeningnummer = ?;", [req.body.body.acctNo])
                    }
                }
                else{
                    res.status(403).send("Pas geblokkeerd");
                }
            }
            else{
                res.status(404).send("Rekeningnummer bestaat niet");
            }
        });
    }
    else{
        console.log("Verzoek gaat naar de landserver");
        // console.log('bank1');
        // console.log(req.body.head);
        sendRequest(req.body, "withdraw", function(success, code, result) {
            // console.log('bank5');
            console.log(result);
		    res.status(code).send(result);
	 	});
    }
});

console.log('de server is gestart');
http.createServer(opts, app).listen(8443);
