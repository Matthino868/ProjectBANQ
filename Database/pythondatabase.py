import mysql.connector
# hello
# sdfl;aksjdf

mydb = mysql.connector.connect(
    host="145.24.222.71",
    database="test_database",
    user="ATMuser1",
    password="Password01!",
    get_warnings =True
)
naam = "Arthur"
# print(mydb)
mycursor = mydb.cursor()

mycursor.execute("select naam,balans from test_tabel where naam = '"+ naam +"';")
data = mycursor.fetchall()
print("===============================================")
print(data[0][0] + " heeft " + str(data[0][1]) + " op zijn rekening")
print("===============================================")

temp = data[0][1] + 50
# print(dir(mycursor))
mycursor.execute("update test_tabel set balans = " + str(temp) + " where naam = '" + naam + "';")
mydb.commit()
# mycursor.fetchall()
# mycursor.close()

mycursor.execute("select naam,balans from test_tabel where naam = '"+ naam +"';")
data1 = mycursor.fetchall()
print("===============================================")
print(data1[0][0] + " heeft nu " + str(data1[0][1]) + " op zijn rekening")
print("===============================================")
