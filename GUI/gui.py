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

#maak alle schermen aan met de nodige functies en variabelen
class InlogScherm(Screen):
    vastNummer = "MKBANQ0000000"
    varNummer = None

    def getNummer(self):
        return InlogScherm.varNummer

    def setNummer(self, nieuwNaam):
        InlogScherm.varNummer = InlogScherm.vastNummer + nieuwNaam

class HoofdScherm(Screen):
    aftrekHoeveelheid = None

    def setHoeveelheid(self, hoeveelheid):
        HoofdScherm.aftrekhoeveelheid = hoeveelheid
        print(HoofdScherm.aftrekhoeveelheid)

    def getHoeveelheid(self):
        return HoofdScherm.aftrekhoeveelheid

class SaldoScherm(Screen):
    pass

class AndersScherm(Screen):

    def setHoeveelheid(self, hoeveelheid):
        HoofdScherm.setHoeveelheid(self, hoeveelheid)

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
        nummer = InlogScherm.getNummer(self)
        mycursor = mydb.cursor()
        sql_query = """SELECT balans FROM test_tabel WHERE rekeningnummer = %s"""
        #sql_query = """SELECT Saldo FROM klanten WHERE naamKlanten = %s"""
        mycursor.execute(sql_query, (nummer,))
        data = mycursor.fetchall()
        SaldoInt = data[0][0]
        #print('Saldo van lucas voor aftrek: ', data[0][0])
        SaldoStr = str(SaldoInt)
        return SaldoStr


    def setSaldo(self):
        aftrek = HoofdScherm.getHoeveelheid(self)
        if isinstance(aftrek, int):
            pass
        elif isinstance(aftrek, str):
            aftrek = int(aftrek)
        nummer = InlogScherm.getNummer(self)
        Saldo = int(self.getSaldo())
        SaldoAf = Saldo - aftrek
        mycursor = mydb.cursor()
        sql_query = """UPDATE test_tabel SET balans = %s WHERE rekeningnummer = %s"""
        #sql_query = """UPDATE klanten SET Saldo = %s WHERE naamKlanten = %s"""
        mycursor.execute(sql_query, (SaldoAf, nummer,))
        mydb.commit()
        #print('Saldo van', naam, 'na aftrek: ', SaldoAf)

    def checkPin(self, nummer, pinCode):
        nummer = InlogScherm.varNummer
        mycursor = mydb.cursor()
        sql_query = """SELECT pincode FROM test_tabel WHERE rekeningnummer = %s"""
        mycursor.execute(sql_query, (nummer,))
        data = mycursor.fetchall()[0][0]
        if data == pinCode:
            return 1
        else:
            return 0

if __name__ == "__main__":
    MyApp().run()