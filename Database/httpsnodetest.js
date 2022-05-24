const https = require('https');
const fs = require('fs');
const messages = require('./messages.json');
const r = messages.noob;
const wysd = messages.wysd;

const opts = {
    key: fs.readFileSync('./keys/country_key.pem'),
    cert: fs.readFileSync('./keys/mk-server-chain.pem'),
    // requestCert: true,
    // rejectUnauthorized: false,
     // ca: [fs.readFileSync(filepaths.noobRoot),
     //      fs.readFileSync(filepaths.noobCA)]
}

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
        const req = await https.request(https_options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (obj) => {
                console.log('1');
                try {
                    console.log(obj);
                    const responseObj = JSON.parse(obj);
                    console.log("2");
                    // const resFromBank = JSON.parse(responseObj).head.fromBank;
                    // const resToBank = sendObj.head.fromBank;
                    // writeLogs("Response from [" + resFromBank + "]. Forwarding to [" + resToBank + "]");
                    _callback(true, res.statusCode, responseObj);
                }
                catch(e) {
                    // writeLogs(r.jsonParseError.message + e.message);
                    console.log("er ging iets mis4")
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
            console.log("er ging iets mis2")
            console.log(e);
            _callback(false, r.requestCompileError.code, r.requestCompileError.message + wysd.seeLogs);
        });
        req.write(JSON.stringify(sendObj));
        req.end();
    } catch(e) {
        // writeLogs(r.sendRequestError.message + e.message);
        console.log("er ging iets mis");
        console.log(e);
        _callback(false, r.sendRequestTLDR.code, r.sendRequestTLDR.message + wysd.blame);
    }
}

balanceRequest = {
    'head':{
       'fromCtry': 'MK',
       'fromBank': 'BANQ',
       'toCtry': 'MK',
       'toBank':'TEST'
    },
    'body':{
       'acctNo':'MKBANQ0000000100',
       'pin':'0000'
    }
}

bal_data = JSON.stringify(balanceRequest);

sendRequest('145.24.222.82', bal_data, "api/balance", 'POST', function(success, code, result) {
    const response = success ? JSON.parse(result) : result;
    console.log(response);
    // res.status(code).send(response);
});
