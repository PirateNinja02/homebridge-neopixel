"use strict";

var Service, Characteristic;

var request = require('request-promise');

async function senddat(dat) {

  // This variable contains the data
  // you want to send

  var options = {
    method: 'POST',

    // http:flaskserverurl:port/route
    uri: 'http://127.0.0.1:5000/senddat',
    body: dat,

    // Automatically stringifies
    // the body to JSON
    json: true
  };

  var sendrequest = request(options)

    // The parsedBody contains the data
    // sent back from the Flask server
    .catch(function (err) {
      console.log(err);
    });
}

const converter = require('color-convert');
const fs = require('fs');

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory('homebridge-gpio-rgb-ledstrip', 'SmartLedStrip', SmartLedStripAccessory);
}

function SmartLedStripAccessory(log, config) {
  this.log      = log;
  this.name     = config['name'];

  this.rPin     = config['rPin'];
  this.gPin     = config['gPin'];
  this.bPin     = config['bPin'];

  this.enabled = true ;

  try {
    if (!this.rPin)
      throw new Error("rPin not set!")
    if (!this.gPin)
      throw new Error("gPin not set!")
    if (!this.bPin)
      throw new Error("bPin not set!")
    if (!fs.existsSync('/dev/pi-blaster'))
      throw new Error("/dev/pi-blaster does not exist!")
  } catch (err) {
    this.log("An error has been thrown! " + err);
    this.log("homebridge-gpio-rgb-ledstrip won't work until you fix this problem");
    this.enabled = false;
  }

}

SmartLedStripAccessory.prototype = {

  getServices : function(){

    if(this.enabled){
      let informationService = new Service.AccessoryInformation();

      informationService
      .setCharacteristic(Characteristic.Manufacturer, 'Manfredi Pistone')
      .setCharacteristic(Characteristic.Model, 'GPIO-RGB-LedStrip')
      .setCharacteristic(Characteristic.SerialNumber, '06-06-00');

      let smartLedStripService = new Service.Lightbulb(this.name);

      smartLedStripService
          .getCharacteristic(Characteristic.On)
          .on('change',this.toggleState.bind(this));

      smartLedStripService
          .addCharacteristic(new Characteristic.Brightness())
          .on('change',this.toggleState.bind(this));

      smartLedStripService
          .addCharacteristic(new Characteristic.Hue())
          .on('change',this.toggleState.bind(this));

      smartLedStripService
          .addCharacteristic(new Characteristic.Saturation())
          .on('change',this.toggleState.bind(this));

      this.informationService = informationService;
      this.smartLedStripService = smartLedStripService;

      this.log("SmartLedStrip has been successfully initialized!");

      return [informationService, smartLedStripService];
    }else{
      this.log("SmartLedStrip has not been initialized, please check your logs..");
      return [];
    }

  },

  isOn : function() {
      return this.smartLedStripService.getCharacteristic(Characteristic.On).value;
  },

  getBrightness : function(){
    return this.smartLedStripService.getCharacteristic(Characteristic.Brightness).value;
  },

  getHue : function(){
    return this.smartLedStripService.getCharacteristic(Characteristic.Hue).value;
  },

  getSaturation : function(){
    return this.smartLedStripService.getCharacteristic(Characteristic.Saturation).value;
  },

  toggleState : function()
  {
    if(this.enabled){
      if(!this.isOn())
      {
          this.updateRGB(0,0,0);
          return;
      }

      var brightness = this.getBrightness();
      if(brightness!=0){
          var rgb = converter.hsv.rgb([this.getHue(), this.getSaturation(), brightness]);
          this.updateRGB(rgb[0], rgb[1], rgb[2]);
      }else{
          this.updateRGB(0,0,0);
      }
    }
  },

  updateRGB : function(red, green, blue)
  {
      this.log("Setting rgb values to: Red: "+red + " Green: "+green+ " Blue: "+blue);
      var data={
array:[red,green,blue]};
senddata(data)

  }

}
