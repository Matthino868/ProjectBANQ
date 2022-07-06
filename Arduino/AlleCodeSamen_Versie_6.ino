#include <Keypad.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Adafruit_Thermal.h>
#include "hrlogoklein.h" 
#include "SoftwareSerial.h"
#define TX_PIN 42 // Arduino transmit  Red WIRE  labeled RX on printer
#define RX_PIN 43 // Arduino receive   Brown WIRE   labeled TX on printer
SoftwareSerial mySerial(RX_PIN, TX_PIN); // Declare SoftwareSerial obj first
Adafruit_Thermal printer(&mySerial);     // Pass addr to printer constructor

#include <Stepper.h>
#define stepperIN1       A2
#define stepperIN2       A3
#define stepperIN3       A4
#define stepperIN4       A5
Stepper stepper(32,stepperIN1,stepperIN3,stepperIN2,stepperIN4);

const int ROW_NUM = 4; //four rows
const int COLUMN_NUM = 4; //four columns

char keys[ROW_NUM][COLUMN_NUM] = {
  {'1','2','3', 'A'},
  {'4','5','6', 'B'},
  {'7','8','9', 'C'},
  {'*','0','#', 'D'}
};

bool scanCheck = false;
int pinCheck = 0;

byte pin_rows[ROW_NUM] = {9, 8, 7, 6}; //connect to the row pinouts of the keypad
byte pin_column[COLUMN_NUM] = {5, 4, 3, 2}; //connect to the column pinouts of the keypad

Keypad keypad = Keypad( makeKeymap(keys), pin_rows, pin_column, ROW_NUM, COLUMN_NUM );

#define RST_PIN         48           // Configurable, see typical pin layout above
#define SS_PIN          53          // Configurable, see typical pin layout above

MFRC522 mfrc522(SS_PIN, RST_PIN);   // Create MFRC522 instance

//*****************************************************************************************//
void setup() {
  Serial.begin(9600);                                           // Initialize serial communications with the PC
  SPI.begin();                                                  // Init SPI bus
  mfrc522.PCD_Init(); 
  //printbon();
  //GaanBanaan();
  
}

//*****************************************************************************************//
void loop() {
   scan();
   key();

   if(scanCheck == true && pinCheck == 4){
    String x;
    while (!Serial.available());
    x = Serial.readString();
    if(x){
      GaanBanaan();
    }
        
      
   }
}

void key(){
  char keypat = keypad.getKey();

  if (keypat){
    Serial.println(keypat);
    pinCheck++;
  }
}

void scan(){
  
  MFRC522::MIFARE_Key key;
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;


  byte block;
  byte size;
  MFRC522::StatusCode status;



  // Reset the loop if no new card present on the sensor/reader. This saves the entire process when idle.
  if ( ! mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Select one of the cards
  if ( ! mfrc522.PICC_ReadCardSerial()) {
    return;
  }


  byte buffer2[18];
  size = sizeof(buffer2);
  block = 1;

  status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &key, &(mfrc522.uid)); //line 834
  if (status != MFRC522::STATUS_OK) {
    Serial.print(F("Authentication failed: "));
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }

  status = mfrc522.MIFARE_Read(block, buffer2, &size);
  if (status != MFRC522::STATUS_OK) {
    Serial.print(F("Reading failed: "));
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }
  String test1 = "";

  for (uint8_t i = 0; i < 16; i++) {
    test1 += (char)buffer2[i];
  }

  Serial.println(test1);
  scanCheck = true;



  delay(1000); //change value if you want to read cards faster

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

void printbon(){
  
  // This line is for compatibility with the Adafruit IotP project pack,
  // which uses pin 7 as a spare grounding point.  You only need this if
  // wired up the same way (w/3-pin header into pins 5/6/7):
  pinMode(7, OUTPUT); 
  digitalWrite(7, LOW);
  // NOTE: SOME PRINTERS NEED 9600 BAUD instead of 19200, check test page.
  mySerial.begin(9600);  // Initialize SoftwareSerial
  //Serial1.begin(19200); // Use this instead if using hardware serial
  printer.begin();        // Init printer (same regardless of serial type)
  printer.setTimes(1,1);

  printer.setFont('A');
  
  // Test character double-height on & off
  printer.doubleHeightOn();
  printer.justify('C');
  printer.println(F("Banq Transactie\n"));
  printer.doubleHeightOff();
  printer.println("Wijnhaven 107");
  printer.println("3011 WN Rotterdam");
  printer.println("3/17/2022\n\n ");
  printer.justify('L');

  printer.println("Rekeningnummer:");
  printer.println("Klantnaam:\n\n  ");
  printer.doubleHeightOn();
  printer.println(F("Totaal: XXX Euro\n\n"));
  printer.doubleHeightOff();
  printer.printBitmap(hrlogoklein_width, hrlogoklein_height, hrlogoklein_data);
  printer.feed(3);
 

  printer.sleep();      // Tell printer to sleep
  delay(3000L);         // Sleep for 3 seconds
  printer.wake();       // MUST wake() before printing again, even if reset
  printer.setDefault(); // Restore printer to defaults
  }


  void GaanBanaan() {
    
  stepper.setSpeed(500);
  stepper.step(2050);
  // Wait and step it back and set the LED back to blue.
  delay(4000);
  //stepper.step(580);
  
}
