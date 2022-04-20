from codecs import namereplace_errors
from unittest.mock import NonCallableMagicMock
import kivy
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

#connect aan de database
mydb = mysql.connector.connect(
    host="145.24.222.71",
    database="test_database",
    user="ATMuser1",
    password="Password01!"
)

#maak alle schermen aan met de nodige functies
class InlogScherm(Screen):
    Naam = None

    def getNaam(self):
        return InlogScherm.Naam

    def setNaam(self, nieuwNaam):
        InlogScherm.Naam = nieuwNaam

class HoofdScherm(Screen):
    pass

class SaldoScherm(Screen):
    pass

class AndersScherm(Screen):
    pass

class CheckScherm(Screen):
    pass

#maak de scherm managers aan
class SchermManagement(ScreenManager):
    pass

class MyApp(App):   
    def build(self):
        return SchermManagement()

    def getSaldo(self):
        global SaldoInt
        global SaldoStr
        naam = InlogScherm.getNaam(self)
        mycursor = mydb.cursor()
        sql_query = """SELECT balans FROM test_tabel WHERE naam = %s"""
        #sql_query = """SELECT Saldo FROM klanten WHERE naamKlanten = %s"""
        mycursor.execute(sql_query, (naam,))
        data = mycursor.fetchall()
        SaldoInt = data[0][0]
        #print('Saldo van lucas voor aftrek: ', data[0][0])
        SaldoStr = str(SaldoInt)
        return SaldoStr

    def setSaldo(self, aftrek):
        naam = InlogScherm.getNaam(self)
        Saldo = int(self.getSaldo())
        SaldoAf = Saldo - aftrek
        mycursor = mydb.cursor()
        sql_query = """UPDATE test_tabel SET balans = %s WHERE naam = %s"""
        #sql_query = """UPDATE klanten SET Saldo = %s WHERE naamKlanten = %s"""
        mycursor.execute(sql_query, (SaldoAf, naam,))
        mydb.commit()
        print('Saldo van', naam, 'na aftrek: ', SaldoAf)

    def checkPin(self, naam, pinCode):
        mycursor = mydb.cursor()
        sql_query = """SELECT pincode FROM test_tabel WHERE naam = %s"""
        mycursor.execute(sql_query, (naam,))
        data = mycursor.fetchall()[0][0]
        if data == pinCode:
            return 1
        else:
            return 0

if __name__ == "__main__":
    MyApp().run()