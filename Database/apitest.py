import requests
import json

# r = requests.get('http://145.24.222.82:8443/test', verify='./keys/noob_root_chain.pem')
# r = requests.get('https://google.com', verify=False)
# print(dir(r))
# print(r.text)
# print(r.content)
# print(r.raw)
# print(r.json)
# print(str(r.status_code)+ '\n')


headers = {"Content-Type": "application/json"}

print("=========Withdraw Request=========")

withdrawRequest = {
   "head":{
      "fromCtry":"MK",
      "fromBank":"BANQ",
      "toCtry":"MK",
      "toBank":"BANQ"
   },
   "body":{
      "acctNo":"MKBANQ0000000300",
      "pin":"0001",
      "amount": 50
   }
}
wr_data = json.dumps(withdrawRequest)

w = requests.post('http://145.24.222.71:8443/withdraw',
   cert = ('./keys/mk_server_chain.pem', './keys/country_key.pem'),
   verify='./keys/noob_root.pem',
   headers=headers,
   data=wr_data
)
# print(dir(w))
# print(w.text)

try:
   data = json.loads(json.loads(w.text))
except:
   print(w.text)
else:
   print('Withdraw status: ' + str(w.status_code))
   print("Account number: " + data['body']['acctNo'])
   print("Success status: "+ str(data['body']['success']))
   print("Withdraw amount: " +str(withdrawRequest['body']['amount']))
   print("Balance: "+  str(data['body']['balance']- withdrawRequest['body']['amount']))

print("=========Balance Request=========")

balanceRequest = {
   'head':{
      'fromCtry': 'MK',
      'fromBank': 'BANQ',
      'toCtry': 'MK',
      'toBank':'BANQ'
   },
   'body':{
      'acctNo':'MKBANQ0000000200',
      'pin':'0001'
   }
}
bal_data = json.dumps(balanceRequest)

b = requests.post('http://145.24.222.71:8443/balance',
   cert = ('./keys/mk_server_chain.pem', './keys/country_key.pem'),
   verify='./keys/noob_root.pem',
   headers=headers,
   data=bal_data
)

try:
   data_balance = json.loads(json.loads(b.text))
except:
   print(b.text)
else:
   print('Balance status: ' + str(b.status_code))
   print("Account number: " + data_balance['body']['acctNo'])
   print("Balance: "+ str(data_balance['body']['balance']))

