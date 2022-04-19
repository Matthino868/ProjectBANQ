[0][1]) + " op zijn rekening")
print("===============================================")

temp = data[0][1] + 50
# print(dir(mycursor))
mycursor.execute("update test_tabel set balans = " + str(temp) + " where naam = '" + naam + "';")
mydb.commit()
mycursor.fetchall()
# mycursor.close()

mycursor.execute("select naam,balans from test_tabel where naam = '"+ naam +"';")
data1 = mycursor.fetchall()
print("===============================================")
print(data1[0][0] + " heeft nu " + str(data1[0][1]) + " op zijn rekening")
print("===============================================")
