import kivy
import requests
import json
from kivy.app import App
from kivy.uix.label import Label
from kivy.uix.relativelayout import RelativeLayout
from kivy.lang import Builder
from kivy.core.image import Image
from kivy.uix.gridlayout import GridLayout
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.textinput import TextInput
from kivy.uix.button import Button
from kivy.uix.widget import Widget
from kivy.uix.screenmanager import ScreenManager, Screen
import mysql.connector
import serial
import time
import threading
from kivy.clock import Clock

#maak alle schermen aan met de nodige functies en variabelen
class BeginScherm(Screen):
    bankNummer = ''

    def nummerCheck(self):
        if BeginScherm.bankNummer != '':
            return 1
        else:
            return 0

    def on_pre_enter(self):
        maakCardThread()

class InlogScherm(Screen):
    inloglabel = ''
    varNummer = None
    pincode = ''

    def getNummer(self):
        return InlogScherm.varNummer

    def setNummer(self, nieuwNaam):
        InlogScherm.varNummer = nieuwNaam

    def resetPinCode(self):
        InlogScherm.pincode = ''

    def on_enter(self):
        maakPinThread()

class HoofdScherm(Screen):
    aftrekHoeveelheid = None

    def setHoeveelheid(self, hoeveelheid):
        HoofdScherm.aftrekhoeveelheid = hoeveelheid
        print(HoofdScherm.aftrekhoeveelheid)

    def getHoeveelheid(self):
        return HoofdScherm.aftrekhoeveelheid

    def resetPinCode(self):
        InlogScherm.pincode = ''

class SaldoScherm(Screen):
    pass

class AndersScherm(Screen):

    def setHoeveelheid(self, hoeveelheid):
        HoofdScherm.setHoeveelheid(self, hoeveelheid)

class CheckScherm(Screen):
    
    def resetPinCode(self):
        InlogScherm.pincode = ''

#maak de scherm managers aan
class SchermManagement(ScreenManager):
    pass

class MyApp(App):  
    def build(self):
        return SchermManagement()

    def getSaldo(self):
        nummer = BeginScherm.bankNummer
        headers = {"Content-Type": "application/json"}
        balanceRequest = {
            'head':{
                'fromCtry': 'MK',
                'fromBank': 'BANQ',
                'toCtry': 'MK',
                'toBank':'BANQ'
            },
            'body':{
                "acctNo": BeginScherm.bankNummer,
                "pin": InlogScherm.pincode
            }
        }
        bal_data = json.dumps(balanceRequest)

        b = requests.post('http://145.24.222.71:8443/balance',
            cert = ('C:/Users/Melle/banqCode/ProjectBANQ/GUI/keys/mk_server_chain.pem', 'C:/Users/Melle/banqCode/ProjectBANQ/GUI/keys/country_key.pem'),
            verify='C:/Users/Melle/banqCode/ProjectBANQ/GUI/keys/noob_root.pem',
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
        SaldoStr = str(data_balance['body']['balance'])
        return SaldoStr


    def setSaldo(self):
        aftrek = HoofdScherm.getHoeveelheid(self)
        if isinstance(aftrek, int):
            pass
        elif isinstance(aftrek, str):
            aftrek = int(aftrek)
        print("gg ", InlogScherm.pincode)
        headers = {"Content-Type": "application/json"}
        withdrawRequest = {
            "head":{
                "fromCtry":"MK",
                "fromBank":"BANQ",
                "toCtry":"MK",
                "toBank":"BANQ"
            },
            "body":{
                "acctNo": BeginScherm.bankNummer,
                "pin": InlogScherm.pincode,
                "amount": aftrek
            }
        }
        wr_data = json.dumps(withdrawRequest)

        w = requests.post('http://145.24.222.71:8443/withdraw',
            cert = ('C:/Users/Melle/banqCode/ProjectBANQ/GUI/keys/mk_server_chain.pem', 'C:/Users/Melle/banqCode/ProjectBANQ/GUI/keys/country_key.pem'),
            verify='C:/Users/Melle/banqCode/ProjectBANQ/GUI/keys/noob_root.pem',
            headers=headers,
            data=wr_data
        )

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
            sendMoney(HoofdScherm.aftrekHoeveelheid)
        

    def checkPin(self):
        headers = {"Content-Type": "application/json"}
        balanceRequest = {
            'head':{
                'fromCtry': 'MK',
                'fromBank': 'BANQ',
                'toCtry': 'MK',
                'toBank':'BANQ'
            },
            'body':{
                "acctNo": BeginScherm.bankNummer,
                "pin": InlogScherm.pincode
            }
        }
        bal_data = json.dumps(balanceRequest)

        b = requests.post('http://145.24.222.71:8443/balance',
            cert = ('C:/Users/Melle/banqCode/ProjectBANQ/GUI/keys/mk_server_chain.pem', 'C:/Users/Melle/banqCode/ProjectBANQ/GUI/keys/country_key.pem'),
            verify='C:/Users/Melle/banqCode/ProjectBANQ/GUI/keys/noob_root.pem',
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
            return 1


class cardThread(threading.Thread):
    def run(self):
        print('kaart thread start')
        arduino = serial.Serial('COM8', 9600)
        time.sleep(2)
        BeginScherm.bankNummer =  arduino.readline().decode('utf-8').rstrip()
        print(BeginScherm.bankNummer) 

class pinThread(threading.Thread):
    def run(self):
        print('pin thread start')
        arduino = serial.Serial('COM8', 9600)
        time.sleep(1)
        for y in range(4):
            x =  arduino.readline().decode('utf-8').rstrip()
            InlogScherm.pincode += x
            InlogScherm.inloglabel += '*'
            print(InlogScherm.inloglabel)
            

def maakCardThread():
    thread1 = cardThread()
    thread1.start()

def maakPinThread():
    thread2 = pinThread()
    thread2.start()

def sendMoney(hoeveelheid):
    #arduino = serial.Serial('COM8', 9600)
    #arduino.write(bytes(hoeveelheid, 'utf-8'))
    #arduino.close()
    pass
    

if __name__ == "__main__":
    MyApp().run()
