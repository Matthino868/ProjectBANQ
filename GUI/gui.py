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
from kivy.properties import StringProperty
from kivy.uix.widget import Widget
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.properties import ObjectProperty
import mysql.connector

#connect aan de database
mydb = mysql.connector.connect(
    host="145.24.222.71",
    database="test_database",
    user="ATMuser1",
    password="Password01!"
)

#maak alle schermen aan
class HoofdScherm(Screen):
    pass

class SaldoScherm(Screen):
    pass

class AndersScherm(Screen):
    pass

class CheckScherm(Screen):
    pass

#maak de scherm manager aan
class SchermManagement(ScreenManager):
    pass


class MyApp(App):   
    def build(self):
        return SchermManagement()

    def getSaldo(self, naam):
        global SaldoInt
        global SaldoStr
        mycursor = mydb.cursor()
        sql_query = """SELECT balans FROM test_tabel WHERE naam = %s"""
        #sql_query = """SELECT Saldo FROM klanten WHERE naamKlanten = %s"""
        mycursor.execute(sql_query, (naam,))
        data = mycursor.fetchall()
        SaldoInt = data[0][0]
        #print('Saldo van lucas voor aftrek: ', data[0][0])
        SaldoStr = str(SaldoInt)
        return SaldoStr

    def setSaldo(self, naam, aftrek):
        Saldo = int(self.getSaldo(naam))
        SaldoAf = Saldo - aftrek
        mycursor = mydb.cursor()
        sql_query = """UPDATE test_tabel SET balans = %s WHERE naam = %s"""
        #sql_query = """UPDATE klanten SET Saldo = %s WHERE naamKlanten = %s"""
        mycursor.execute(sql_query, (SaldoAf, naam,))
        mydb.commit()
        print('Saldo van', naam, 'na aftrek: ', SaldoAf)
        


    

if __name__ == "__main__":
    MyApp().run()
