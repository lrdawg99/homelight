/*************************************
Duke University
Logan Rooper
Created Nov 17th, 2014

Arduino YUN Rest Inteface RGB LED
controller
myip: 10.190.196.11
*************************************/

#include <Bridge.h>
#include <YunServer.h>
#include <YunClient.h>
#include <HttpClient.h>
#define OFF 0
#define ON 1
#define DEMO 2
#define SET 3
#define REDPIN 3
#define GREENPIN 5
#define BLUEPIN 6
 

YunServer server;
int mode = ON;
int prevmode = 0;
int redping = 0; //cap at 1000
int red = 255;
int green = 255;
int blue = 255;
String rgb = "000000000";

void setup()
{
  Serial.begin(9600);
  Serial.println("Starting up...");
  Serial.println("homelight rgb strip controller");
  Bridge.begin();
  pinMode(REDPIN, OUTPUT);
  pinMode(GREENPIN, OUTPUT);
  pinMode(BLUEPIN, OUTPUT);
  Serial.println("Done.");
  
  server.listenOnLocalhost();
  server.begin();
}

void loop()
{
  YunClient client = server.accept();
  
  if (client) {
    Serial.println("New client.");
    process(client);
    client.stop();
  }
  
  //redping overrides everything
  if (redping > 1) {
    
    analogWrite(BLUEPIN, 0);
    analogWrite(GREENPIN, 0);
    analogWrite(REDPIN, 255);
    delay(250);
    analogWrite(REDPIN, 50);
    delay(250);
    analogWrite(REDPIN, 255);
    delay(250);
    analogWrite(REDPIN, 50);
        
    redping = 0;
  } else if (mode == DEMO) {
    red += 0.3;
    green += 0.5;
    blue += 1;
    
    if (red > 255) {
      red = 0;
    }
    if (blue > 255) {
      blue = 0;
    }
    if (green > 255) {
      green = 0;
    } 
  
  } else if (mode == ON) {
     red = 255;
     blue = 255;
     green = 255;
     
  } else if (mode == OFF) {
     red = 0;
     blue = 0;
     green = 0;
  } else if (mode == SET) {
    red = rgb.substring(0,3).toInt();
    green = rgb.substring(3,6).toInt();
    blue = rgb.substring(6).toInt();
  } else {
    //default nothing
  }
  
  //set actual colors
  analogWrite(REDPIN, red);
  analogWrite(GREENPIN, green);
  analogWrite(BLUEPIN, blue);
}

void process(YunClient client) {
  
  char cmd[] = client.readStringUntil('/');
  Serial.println("Client wants: " + cmd);

  if (strcmp(cmd, "demo") == 0) {
     mode = DEMO;
     Serial.println("mode changed: demo");
  } else
  if (strcmp(cmd, "rgb") == 0) {
    rgb = client.readStringUntil(';');
    mode = SET;
    Serial.println("mode changed: set: " + rgb);

  } else
  if (strcmp(cmd, "on") == 0) {
    mode = ON;
    Serial.println("mode changed: on");
  } else
  if (strcmp(cmd, "off") == 0) {
     mode = OFF;
     Serial.println("mode changed: off");
  } else {
    //error!
    Serial.println("mode not found: " + cmd);
    redping = 500;
  } 
}

