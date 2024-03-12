// Load fonts

require("Font4x5").add(Graphics);
require("Font8x12").add(Graphics);
require("Font8x16").add(Graphics);

const storage = require('Storage');
const locale = require("locale");

var settings = Object.assign({
	hourcode : '#f00',
  hourcolor : 'Red',
  mincode : '#0f0',
  mincolor : 'Green',
  bothcode : '#ff0',
  bothcolor : 'Blue',
  emptycode : '#ff0',
  emptycolor : 'Orange',
  timecode : '#ff0',
  timecolor : 'Orange',
	showtime: false,
}, require('Storage').readJSON("fiboclk.json", true) || {});



// 176x176 Screen

// add modifiied 4x5 numeric font
(function(graphics) {
  graphics.prototype.setFont4x5NumPretty = function() {
    this.setFontCustom(atob("IQAQDJgH4/An4QXr0Fa/BwnwdrcH63BCHwfr8Ha/"),45,atob("AwIEBAQEBAQEBAQEBA=="),5);
  };
})(Graphics);

// Which squares are turned on for hours (1), minutes (2) or both (3)
// 1, 1, 2, 3, 5
const bits = [0, 0, 0, 0, 0];

const squares = [[74,73,125,124],[125,73,176,124],[74,124,176,176],[0,73,74,176],[0,0,176,73]];
const visibility_color = ['#000', '#000', '#000', '#000'];

old_hours = 0;
old_mins = 0;
//const y_offset = 66;

// Update clock in millisec (Only shows in multiples of 5 minutes)
// const UPDATE_INTERVAL_MS = 60000; // One minute
const UPDATE_INTERVAL_MS = 300000; // 5 min

// timeout used to update every 5 minute
var drawTimeout;

const SUN = 1;
const PART_SUN = 2;
const CLOUD = 3;
const SNOW = 4;
const RAIN = 5;
const STORM = 6;
const ERR = 7;

/**
Choose weather icon based on weather const
Weather icons from https://icons8.com/icon/set/weather/ios-glyphs
Error icon from https://icons8.com/icon/set/error-cloud/ios-glyphs
**/
function weatherIcon(weather) {
  switch (weather) {
    case SUN:
      return atob("Hh4BAAAAAAAMAAAAMAAAAMAAAAMAABgMBgBwADgA4AHAAY/GAAB/gAAD/wAAH/4AAP/8AAP/8AfP/8+fP/8+AP/8AAP/8AAH/4AAD/wAAB/gAAY/GAA4AHABwADgBgMBgAAMAAAAMAAAAMAAAAMAAAAAAAA=");
    case PART_SUN:
      return atob("Hh4BAAAAAAAAAAAMAAAAMAAAEMIAAOAcAAGAYAAAeAAAA/AAAB/gAA5/gAA5/g+AB+D/gA4H/wAR//wGD//4OD//4EH//4AH//4Af//+Af//+A////A////A////A///+Af//+AH//4AAAAAAAAAAAAAAAA=");
    case CLOUD:
      return atob("Hh4BAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AAAf+AAA//AAB//gAf//gB///wB///wD///wD///wP///8f///+f///+////////////////////f///+f///+P///8D///wAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    case SNOW:
      return atob("Hh4BAAAAAAAAAAAAAAAAAHwAAAf8AAA/+AAH/+AAf//AAf8/AA/8/AB/gHgH/wP4H/wP4P/gH8P/8/8P/8/8P///4H///4B///gAAAAAAMAAAAMAAAB/gGAA/AfgA/AfgB/gfgAMAfgAMAGAAAAAAAAAAAA=");
    case RAIN:
      return atob("Hh4BAAAAAAAAAAAAAAAAAHwAAAf8AAA/+AAH/+AAf//AAf//AA///AB///gH///4H///4P///8P///8P///8P///4H///4B///gAAAAAAAAAABgBgABgBgABhhhgABgBgABgBgAAAAAAAAAAAAAAAAAAAAA=");
    case STORM:
      return atob("Hh4BAAAAAAAAAAAAAAAAAHwAAAf8AAA/+AAH/+AAf//AAf//AA///AB///gH///4H/x/4P/g/8P/k/8P/E/8P/M/4H+MP4B+cHgAAfgAAA/gABg/AABgHAABgGBgAAGBgAAEBgAAEAAAAAAAAAAAAAAAAAA=");
    case ERR:
    default:
      return atob("Hh4BAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AAAf+AAA//AAB//gAf//gB///wB/z/wD/z/wD/z/wP/z/8f/z/+f/z/+//z//////////////z//f/z/+f///+P///8D///wAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    }
}


/**
Choose weather icon to display based on condition.
Based on function from the Bangle weather app so it should handle all of the conditions
sent from gadget bridge.
*/
function chooseIcon(condition) {
  condition = condition.toLowerCase();
  if (condition.includes("thunderstorm")) return weatherIcon(STORM);
  if (condition.includes("freezing")||condition.includes("snow")||
    condition.includes("sleet")) {
    return weatherIcon(SNOW);
  }
  if (condition.includes("drizzle")||
    condition.includes("shower")) {
    return weatherIcon(RAIN);
  }
  if (condition.includes("rain")) return weatherIcon(RAIN);
  if (condition.includes("clear")) return weatherIcon(SUN);
  if (condition.includes("few clouds")) return weatherIcon(PART_SUN);
  if (condition.includes("scattered clouds")) return weatherIcon(CLOUD);
  if (condition.includes("clouds")) return weatherIcon(CLOUD);
  if (condition.includes("mist") ||
    condition.includes("smoke") ||
    condition.includes("haze") ||
    condition.includes("sand") ||
    condition.includes("dust") ||
    condition.includes("fog") ||
    condition.includes("ash") ||
    condition.includes("squalls") ||
    condition.includes("tornado")) {
    return weatherIcon(CLOUD);
  }
  return weatherIcon(CLOUD);
}

/*
* Choose weather icon to display based on weather conditition code
* https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
*/
function chooseIconByCode(code) {
  const codeGroup = Math.round(code / 100);
  switch (codeGroup) {
    case 2: return weatherIcon(STORM);
    case 3: return weatherIcon(RAIN);
    case 5: return weatherIcon(RAIN);
    case 6: return weatherIcon(SNOW);
    case 7: return weatherIcon(CLOUD);
    case 8:
      switch (code) {
        case 800: return weatherIcon(SUN);
        case 801: return weatherIcon(PART_SUN);
        default: return weatherIcon(CLOUD);
      }
      break;
    default: return weatherIcon(CLOUD);
  }
}

/**
Get weather stored in json file by weather app.
*/
function getWeather() {
  let jsonWeather = storage.readJSON('weather.json');
  return jsonWeather;
}

function square(x, y, w, e, fgc, bgc) {
  g.setColor(fgc).fillRect(x,y,x+w,y+w);
  g.setColor(bgc).fillRect(x+e,y+e,x+w-e,y+w-e);
}

// schedule a draw for the next (5) minute
function queueDraw() {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function() {
    drawTimeout = undefined;
    draw();
  }, UPDATE_INTERVAL_MS - (Date.now() % UPDATE_INTERVAL_MS));
}

function setBits(value, offset) {
  //console.log("Before setting " + value + " value at offset " + offset + "  Bits 1.2: " + bits[0] + ",   1.1: " + bits[1] + ",   2: " + bits[2] + ",   3: " + bits[3] + ",   5: " + bits[4] );
  switch(value) {
    case 1:
      switch(Math.floor(Math.random()*2))
      {
        case 0:
          bits[0]|=offset;
          break;
        case 1:
          bits[1]|=offset;
          break;
      }
      break;
    case 2:
      switch(Math.floor(Math.random()*2))
      {
        case 0:
          bits[2]|=offset;
          break;
        case 1:
          bits[0]|=offset;
          bits[1]|=offset;
          break;
      }
      break;
    case 3:
      switch(Math.floor(Math.random()*3))
      {
        case 0:
          bits[3]|=offset;
          break;
        case 1:
          bits[0]|=offset;
          bits[2]|=offset;
          break;
        case 2:
          bits[1]|=offset;
          bits[2]|=offset;
          break;
      }
      break;
    case 4:
      switch(Math.floor(Math.random()*3))
      {
        case 0:
          bits[0]|=offset;
          bits[3]|=offset;
          break;
        case 1:
          bits[1]|=offset;
          bits[3]|=offset;
          break;
        case 2:
          bits[0]|=offset;
          bits[1]|=offset;
          bits[2]|=offset;
          break;
      }
      break;
    case 5:
      switch(Math.floor(Math.random()*3))
      {
        case 0:
          bits[4]|=offset;
          break;
        case 1:
          bits[2]|=offset;
          bits[3]|=offset;
          break;
        case 2:
          bits[0]|=offset;
          bits[1]|=offset;
          bits[3]|=offset;
          break;
      }
      break;
    case 6:
      switch(Math.floor(Math.random()*4))
      {
        case 0:
          bits[0]|=offset;
          bits[4]|=offset;
          break;
        case 1:
          bits[1]|=offset;
          bits[4]|=offset;
          break;
        case 2:
          bits[0]|=offset;
          bits[2]|=offset;
          bits[3]|=offset;
          break;
        case 3:
          bits[1]|=offset;
          bits[2]|=offset;
          bits[3]|=offset;
          break;
      }
      break;
    case 7:
      switch(Math.floor(Math.random()*3))
      {
        case 0:
          bits[2]|=offset;
          bits[4]|=offset;
          break;
        case 1:
          bits[0]|=offset;
          bits[1]|=offset;
          bits[4]|=offset;
          break;
        case 2:
          bits[0]|=offset;
          bits[1]|=offset;
          bits[2]|=offset;
          bits[3]|=offset;
          break;
      }
      break;
    case 8:
      switch(Math.floor(Math.random()*3))
      {
        case 0:
          bits[3]|=offset;
          bits[4]|=offset;
          break;
        case 1:
          bits[0]|=offset;
          bits[2]|=offset;
          bits[4]|=offset;
          break;
        case 2:
          bits[1]|=offset;
          bits[2]|=offset;
          bits[4]|=offset;
          break;
      }      
      break;
    case 9:
      switch(Math.floor(Math.random()*2))
      {
        case 0:
          bits[0]|=offset;
          bits[3]|=offset;
          bits[4]|=offset;
          break;
        case 1:
          bits[1]|=offset;
          bits[3]|=offset;
          bits[4]|=offset;
          break;
      }      
      break;
    case 10:
      switch(Math.floor(Math.random()*2))
      {
        case 0:
          bits[2]|=offset;
          bits[3]|=offset;
          bits[4]|=offset;
          break;
        case 1:
          bits[0]|=offset;
          bits[1]|=offset;
          bits[3]|=offset;
          bits[4]|=offset;
          break;
      }            
      break;
    case 11:
      switch(Math.floor(Math.random()*2))
      {
        case 0:
          bits[0]|=offset;
          bits[2]|=offset;
          bits[3]|=offset;
          bits[4]|=offset;
          break;
        case 1:
          bits[1]|=offset;
          bits[2]|=offset;
          bits[3]|=offset;
          bits[4]|=offset; 
          break;
      }

      break;
    case 12:
      bits[0]|=offset;
      bits[1]|=offset;
      bits[2]|=offset;
      bits[3]|=offset;
      bits[4]|=offset;
      break;
  }
  //console.log("After setting " + value + " value at offset " + offset + "  Bits 1.2: " + bits[0] + ",   1.1: " + bits[1] + ",   2: " + bits[2] + ",   3: " + bits[3] + ",   5: " + bits[4] );
}

function draw_rect(x1, y1, x2, y2, color) {
  
  g.setColor('#000');
  
  g.drawRect(x1, y1, x2, y2);
  
  g.setColor(color);
  
  g.fillRect(x1 + 1, y1 + 1, x2 - 1, y2 - 1);
  
}

function invert_color_calc(color) {
  switch(color) {
    case '#0f0': // Green
      return '#000';
    case '#ff0': // Orange
      return '#000';
    case '#0ff': // Cyan
      return '#000';
    case '#f0f': // Purple
      return '#fff';
    case '#f00': // Red
      return '#fff';
    case '#00f': // Blue
      return '#fff';
    case '#fff': // White
      return '#000';
    case '#000': // Black
      return '#fff';
  }
}

function draw() {
  

  
  //let squares = [];
  //const SQ_5 = [3, 0, 8, 5];
  //const SQ_3 = [0, 2, 3, 5];
  //const SQ_2 = [0, 0, 2, 2];
  //const SQ_1_1 = [2, 0, 3, 1];
  //const SQ_1_2 = [2, 1, 3, 2];
  
  /*for (let i = 0; i <= 4; i++) {
    squares[i] = [];
  }*/

  let steps = Bangle.getHealthStatus("day").steps;
  
  for (let i = 0; i <= 4; i++) {
    bits[i] = 0;
  }
  
	var dt = new Date();
	var h = dt.getHours(), m = dt.getMinutes(), d = dt.getDate();

  h = h % 12;

  if ((Math.floor(old_mins / 5) == Math.floor(m / 5)) && (old_hours == h)) {
    // queue draw for next minute interval
    queueDraw();
    return;
  }
  

  old_mins = m;
  old_hours = h;

	
	//g.clearRect(Bangle.appRect);

	var gap = 1;
	var side = 22;
  
	if (settings.fullscreen) {
		gap = 0;
    side = 22;
	}
  
  /*for (let i = 0; i <= 3; i++) {
    squares[4][i] = SQ_5[i] * side;
    squares[3][i] = SQ_3[i] * side;
    squares[2][i] = SQ_2[i] * side;
    squares[1][i] = SQ_1_1[i] * side;
    squares[0][i] = SQ_1_2[i] * side;
    
  }*/

  setBits(h, 0x01);
  setBits(Math.floor(m / 5), 0x02);
  
  
  //console.log(m);
  //console.log(Math.floor(m / 5));

  g.reset();
  
  for (let i = 0; i <= 4; i++) {
    //console.log("Drawing sq: " + i + " at (" + squares[i][0] + "," + squares[i][1] + "), (" + squares[i][2] + "," + squares[i][3] + "), Color:" + pallete[bits[i]]);
    draw_rect(squares[i][0], squares[i][1], squares[i][2], squares[i][3], pallete[bits[i]]);
  }
  
  //g.setFont("8x16",2);
  g.setFont("Vector", 25);
  //g.setFont("4x5NumPretty",4);
  g.setFontAlign(0,0); // align center bottom
  
  g.setColor(visibility_color[bits[4]]);
  g.setBgColor(pallete[bits[4]]);
  
  
  // pad the date - this clears the background if the date were to change length
  var dateStr = "    " + require("locale").dow(new Date(), 1) + " " + require("locale").month(new Date(), 1) + ", " + d + "    ";
  g.drawString(dateStr, g.getWidth()/2, 38);
  
  if (settings.showtime == true) {
    console.log("Drawing time");
    // Draw time (for cheating/verification.)
    //g.setColor(settings.timecode);
    g.setFont("4x5",2);
    //g.setFont("4x5NumPretty",4);
    //g.setFont("Vector", 25);
    g.setFontAlign(0,0); // align center center

    g.setColor(visibility_color[bits[0]]);
    //var timeStr = h + ":" + m.toString().padStart(2,0);
    //g.drawString(timeStr, g.getWidth()/2, 64, true /*clear background*/);
    g.drawString(require("locale").time(new Date(), 1), (squares[0][0] + squares[0][2]) / 2, (squares[0][1] + squares[0][3]) / 2);
    
  }
  
  var weatherJson = getWeather();
  var wIcon;
  var temp;
  if(weatherJson && weatherJson.weather){
      var currentWeather = weatherJson.weather;
      temp = locale.temp(currentWeather.temp-273.15).match(/^(\D*\d*)(.*)$/);
      const code = currentWeather.code||-1;
      if (code > 0) {
        wIcon = chooseIconByCode(code);
      } else {
        wIcon = chooseIcon(currentWeather.txt);
      }
  }else{
      temp = "";
      wIcon = weatherIcon(ERR);
  }

  g.setColor(visibility_color[bits[2]]);
  g.setBgColor(pallete[bits[2]]);
  
  var temp_y = (squares[2][1] + squares[2][3]) / 2;
  
  g.drawImage(wIcon,(squares[0][0] + squares[0][2]) / 2 - 15, temp_y - 15);

  //g.clearRect(108,114,176,114+4*5);
  if (temp != "") {
    var tempWidth;
    const mid=(squares[1][0] + squares[1][2]) / 2;
    if (temp[1][0]=="-") {
      // do not account for - when aligning
      const minusWidth=3*4;
      tempWidth = minusWidth+(temp[1].length-1)*4*4;
      x = mid-Math.round((tempWidth-minusWidth)/2)-minusWidth;
    } else {
      tempWidth = temp[1].length*4*4;
      x = mid-Math.round(tempWidth/2);
    }
    g.setFont("4x5NumPretty",4);
    g.setFontAlign(0,0); // align center center
    g.drawString(temp[1], x + 16, temp_y);
    //draw_rect(x + tempWidth, temp_y - 10, x + tempWidth + 4, temp_y - 10 + 4, visibility_color[bits[2]]);
    square(x + tempWidth, temp_y - 10, 6, 2,visibility_color[bits[2]], pallete[bits[2]]);
    
  }
  
  
  g.setFontAlign(0,0); // align center center
  g.setColor(visibility_color[bits[1]]);
  g.setFont("4x5",2);
  
  g.drawString("Steps", (squares[1][0] + squares[1][2]) / 2 + 1, (squares[1][1] + squares[1][3]) / 2 - 10);
  g.drawString(steps, (squares[1][0] + squares[1][2]) / 2 + 1, (squares[1][1] + squares[1][3]) / 2 + 10);
  
  console.log(h + ":" + m + " m/5: " + Math.floor(m / 5) + "  Bits 1.2: " + bits[0] + ",   1.1: " + bits[1] + ",   2: " + bits[2] + ",   3: " + bits[3] + ",   5: " + bits[4] + "\n" );
/*
	if (settings.showdate) {
		g.setFontAlign(0, 0);
		g.setFont("Vector",20);
		g.drawRect(Math.floor(mgn/2) + gap, mgn + gap, Math.floor(mgn/2) + gap + sq, mgn + gap + sq);
		g.drawString(d, Math.ceil(mgn/2) + gap + Math.ceil(sq/2) + 1, mgn + gap + Math.ceil(sq/2) + 1);
	}
*/
  // queue draw in one minute
  queueDraw();
}

// Orange (off), H (Red), M (Green), Both (Blue)
const pallete = ['#ff0', '#f00', '#0f0', '#00f'];
pallete[0] = settings.emptycode;
pallete[1] = settings.hourcode;
pallete[2] = settings.mincode;
pallete[3] = settings.bothcode;

for (let i = 0; i <= 3; i++) {
  visibility_color[i] = invert_color_calc(pallete[i]);
}

g.clear();

draw();
//var secondInterval = setInterval(draw, 60000);
Bangle.setUI("clock");
/*
if (!settings.fullscreen) {
	Bangle.loadWidgets();
	Bangle.drawWidgets();
}
*/

