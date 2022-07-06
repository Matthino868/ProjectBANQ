#include <Stepper.h>
#define stepperIN1       A2
#define stepperIN2       A3
#define stepperIN3       A4
#define stepperIN4       A5

Stepper stepper(32,stepperIN1,stepperIN3,stepperIN2,stepperIN4);

void setup() {
  Serial.begin(9600);  

}

void loop() {
  stepper.setSpeed(500);
  stepper.step(-2050);
  delay(4000);
  //stepper.step(580);

}
