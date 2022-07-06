// Include required libraries
#include <MFRC522.h>
#include <Keypad.h>
#include <SPI.h>
#include <Stepper.h>
#include <Adafruit_Thermal.h>
//#include "hrlogoklein.h" 
#include "SoftwareSerial.h"
#define TX_PIN 3 // Arduino transmit  Red WIRE  labeled RX on printer
#define RX_PIN 2 // Arduino receive   Brown WIRE   labeled TX on printer

#define stepperIN1       A2
#define stepperIN2       A3
#define stepperIN3       A4
#define stepperIN4       A5

// Create instances
MFRC522 mfrc522(10, 9); // MFRC522 mfrc522(SS_PIN, RST_PIN)
Stepper stepper(32,stepperIN1,stepperIN3,stepperIN2,stepperIN4);
SoftwareSerial mySerial(RX_PIN, TX_PIN); // Declare SoftwareSerial obj first
Adafruit_Thermal printer(&mySerial);     // Pass addr to printer constructor


char initial_password[4] = {'1', '2', '3', '4'};  // Variable to store initial password
String tagUID = "D4 EA 04 2A";  // String to store UID of tag. Change it with your tag's UID
char password[4];   // Variable to store users password
boolean RFIDMode = true; // boolean to change modes
char key_pressed = 0; // Variable to store incoming keys
uint8_t i = 0;  // Variable used for counter

// defining how many rows and columns our keypad have
const byte rows = 4;
const byte columns = 3;

// Keypad pin map
char hexaKeys[rows][columns] = {
  {'1', '2', '3'},
  {'4', '5', '6'},
  {'7', '8', '9'},
  {'*', '0', '#'}
};

// Initializing pins for keypad
byte row_pins[rows] = {8, 7, 6, 5};
byte column_pins[columns] = {4, A0, A1};

// Create instance for keypad
Keypad keypad_key = Keypad( makeKeymap(hexaKeys), row_pins, column_pins, rows, columns);

void setup() {
    Serial.begin(9600);  
    SPI.begin();      // Init SPI bus
    mfrc522.PCD_Init();  
    Serial.println("Approximate your card to the reader...");
    Serial.println();
}

void loop() {
  // System will first look for mode
  if (RFIDMode == true) {
   
    Serial.println(" Scan Your Tag ");
     delay(2000);

    // Look for new cards
    if ( ! mfrc522.PICC_IsNewCardPresent()) {
      return;
    }

    // Select one of the cards
    if ( ! mfrc522.PICC_ReadCardSerial()) {
      return;
    }

    //Reading from the card
    String tag = "";
    for (byte j = 0; j < mfrc522.uid.size; j++)
    {
      tag.concat(String(mfrc522.uid.uidByte[j] < 0x10 ? " 0" : " "));
      tag.concat(String(mfrc522.uid.uidByte[j], HEX));
    }
    tag.toUpperCase();

    //Checking the card
    if (tag.substring(1) == tagUID)
    {
      // If UID of tag is matched.
    
      Serial.println("Tag Matched");
      Serial.println("Enter Password:");
      RFIDMode = false; // Make RFID mode false
    }

    else
    {
      // If UID of tag is not matched.
      Serial.println("Wrong Tag Shown");
      Serial.println("Access Denied");
    }
  }

  // If RFID mode is false, it will look for keys from keypad
  if (RFIDMode == false) {
    key_pressed = keypad_key.getKey(); // Storing keys
    if (key_pressed)
    {
      password[i++] = key_pressed; // Storing in password variable
      Serial.print("*");
      
    }
    if (i == 4) // If 4 keys are completed
    {
      delay(200);
      if (!(strncmp(password, initial_password, 4))) // If password is matched
      {
        Authenticated();
        printbon();
        i = 0;
        delay(2000);
        RFIDMode = true; // Make RFID mode true
      }
      else    // If password is not matched
      {
        Serial.println("Wrong Password");
        i = 0;
        RFIDMode = true;  // Make RFID mode true
      }
    }
  }
}
void Authenticated() {
  // This is called when a valid ID is read.
  Serial.println("Authorised access");
    Serial.println();
    delay(3000);
 
  
  stepper.setSpeed(500);
  stepper.step(-2050);
  // Wait and step it back and set the LED back to blue.
  delay(4000);
  //stepper.step(580);
  
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

  printer.feed(2);
 
  printer.sleep();      // Tell printer to sleep
  delay(3000L);         // Sleep for 3 seconds
  printer.wake();       // MUST wake() before printing again, even if reset
  printer.setDefault(); // Restore printer to defaults
  }
