import requests
import json

r = requests.get('http://145.24.222.71:8443/test', verify='C:\school\Vakken\Project34-PinAutomaat\Keys\mk-server-chain.pem')
# r = requests.get('https://google.com', verify=False)
# print(dir(r))
# print(r.text)
# print(r.content)
# print(r.raw)
# print(r.json)
print(str(r.status_code)+ '\n')

headers = {"Content-Type": "application/json"}

print("=========Withdraw Request=========")

withdrawRequest = {
   "head":{
      "fromCtry":"T1",
      "fromBank":"TES",
      "toCtry":"T1",
      "toBank":"TES"
   },
   "body":{
      "acctNo":"5",
      "pin":"0101",
      "amount": 5000
   }
}
wr_data = json.dumps(withdrawRequest)

w = requests.post('http://145.24.222.71:8443/withdraw',
    cert = ('C:\school\Vakken\Project34-PinAutomaat\Keys\mk-server-chain.pem', 'C:\school\Vakken\Project34-PinAutomaat\Keys\country_key.pem'),
    verify='C:\school\Vakken\Project34-PinAutomaat\Keys\mk-server-chain.pem',
    headers=headers,
    data=wr_data
)
# print(dir(w))
# print(w.text)


data = json.loads(json.loads(w.text))
print('Withdraw status: ' + str(w.status_code))
print("Account number: " + data['body']['acctNo'])
print("Success status: "+ str(data['body']['success']))
print("Withdraw amount: " +str(withdrawRequest["body"]["amount"]))

print("=========Balance Request=========")

balanceRequest = {
   'head':{
      'fromCtry': 'MK',
      'fromBank': 'BANQ',
      'toCtry': 'T1',
      'toBank':'TEST'
   },
   'body':{
      'acctNo':'MKBANQ0000000100',
      'pin':'0000'
   }
}
bal_data = json.dumps(balanceRequest)

b = requests.post('http://145.24.222.71:8443/balance',
    cert = ('C:\school\Vakken\Project34-PinAutomaat\Keys\mk-server-chain.pem', 'C:\school\Vakken\Project34-PinAutomaat\Keys\country_key.pem'),
    verify='C:\school\Vakken\Project34-PinAutomaat\Keys\mk-server-chain.pem',
    headers=headers,
    data=bal_data
)
# print(bal_data)
print(b.status_code)
data_balance = json.loads(json.loads(b.text))
print (data_balance)
print('Balance status: ' + str(b.status_code))
print("Account number: " + data_balance['body']['acctNo'])
print("Balance: "+ str(data_balance['body']['amount']))










print("\nBalance status: " + str(b.status_code))
# print(b.text)
balance_response = b.json()
print("fromCtry: " + balance_response["head"]["fromCtry"])
print("fromBank: " + balance_response["head"]["fromBank"])
print("toCtry: " + balance_response["head"]["toCtry"])
print("toBank: " + balance_response["head"]["toBank"])
print("Account number: " + balance_response["body"]["acctNo"])
print("Success status: "+ str(balance_response["body"]["amount"]))

headers = {"Content-Type": "application/json"}
balancePayload = {
   "head":{
      "fromCtry":"MK",
      "fromBank":"BANQ",
      "toCtry":"T1",
      "toBank":"TEST"
   },
   "body":{
      "acctNo":"5",
      "pin":"0101"
   }
}
bal_data = json.dumps(balancePayload)
print('Balance request: ' + bal_data+ '\n')

b = requests.post('https://145.24.222.82:8443/api/balance',
    cert = ('C:\school\Vakken\Project34-PinAutomaat\Keys\mk-server-chain.pem', 'C:\school\Vakken\Project34-PinAutomaat\Keys\country_key.pem'),
    verify='C:/school/Vakken/Project34-PinAutomaat/Keys/145-24-222-82.pem',
    headers=headers,
    data=bal_data)
print('Balance status: ' + str(b.status_code) + ',\n response: ' + b.text +'\n')

withdrawPayload = {
   "head":{
      "fromCtry":"T1",
      "fromBank":"TES",
      "toCtry":"T1",
      "toBank":"TES"
   },
   "body":{
      "acctNo":"5",
      "pin":"0101",
      "amount": 5000
   }
}
wdw_data = json.dumps(withdrawPayload)
print('Withdraw request: ' + wdw_data+ '\n')


w = requests.post('https://145.24.222.82:8443/api/withdraw',
    cert = ('C:\school\Vakken\Project34-PinAutomaat\Keys\mk-server-chain.pem', 'C:\school\Vakken\Project34-PinAutomaat\Keys\country_key.pem'),
    verify='C:\school\Vakken\Project34-PinAutomaat\Keys\mk-server-chain.pem',
    headers=headers,
    data=wdw_data)
print('Withdraw status: ' + str(w.status_code) + ',\n response: ' + w.text+'\n')
print("=============================================================")

v = requests.get('https://145.24.222.82:8080', verify='C:\school\Vakken\Project34-PinAutomaat\Keys\mk-server-chain.pem')
print(v.text)
print(v.status_code)
