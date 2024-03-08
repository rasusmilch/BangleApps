// Load fonts

//require("Font8x12").add(Graphics);
require("Font8x16").add(Graphics);

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

// Which squares are turned on for hours (1), minutes (2) or both (3)
// 1, 1, 2, 3, 5
const bits = [0, 0, 0, 0, 0];

old_hours = 0;
old_mins = 0;
const y_offset = 66;

// Update clock in millisec (Only shows in multiples of 5 minutes)
// const UPDATE_INTERVAL_MS = 60000; // One minute
const UPDATE_INTERVAL_MS = 300000; // 5 min

// timeout used to update every 5 minute
var drawTimeout;

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
  
  g.drawRect(x1, y1 + y_offset, x2, y2 + y_offset);
  
  g.setColor(color);
  
  g.fillRect(x1 + 1, y1 + y_offset + 1, x2 - 1, y2 + y_offset - 1);
  
}

function draw() {
  
  // Orange (off), H (Red), M (Green), Both (Blue)
  const pallete = ['#ff0', '#f00', '#0f0', '#00f'];
  pallete[0] = settings.emptycode;
  pallete[1] = settings.hourcode;
  pallete[2] = settings.mincode;
  pallete[3] = settings.bothcode;
  
  let squares = [];
  const SQ_5 = [3, 0, 8, 5];
  const SQ_3 = [0, 2, 3, 5];
  const SQ_2 = [0, 0, 2, 2];
  const SQ_1_1 = [2, 0, 3, 1];
  const SQ_1_2 = [2, 1, 3, 2];
  
  for (let i = 0; i <= 4; i++) {
    squares[i] = [];
  }

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
  
  g.reset();
  g.setFont("8x16",2);
  g.setFontAlign(0,1); // align center bottom
  g.setColor('#000');
  
  // pad the date - this clears the background if the date were to change length
  var dateStr = "    " + require("locale").dow(new Date(), 1) + " " + require("locale").month(new Date(), 1) + ", " + d + "    ";
  g.drawString(dateStr, g.getWidth()/2, 32, true /*clear background*/);
  
  if (settings.showtime == true) {
    // Draw time (for cheating/verification.)
    g.setColor(settings.timecode);

    //var timeStr = h + ":" + m.toString().padStart(2,0);
    //g.drawString(timeStr, g.getWidth()/2, 64, true /*clear background*/);
    g.drawString(require("locale").time(new Date(), 1), g.getWidth()/2, 64, true /*clear background*/);
    
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
  
  for (let i = 0; i <= 3; i++) {
    squares[4][i] = SQ_5[i] * side;
    squares[3][i] = SQ_3[i] * side;
    squares[2][i] = SQ_2[i] * side;
    squares[1][i] = SQ_1_1[i] * side;
    squares[0][i] = SQ_1_2[i] * side;
    
  }

  setBits(h, 0x01);
  setBits(Math.floor(m / 5), 0x02);
  
  
  //console.log(m);
  //console.log(Math.floor(m / 5));
  
  for (let i = 0; i <= 4; i++) {
    draw_rect(squares[i][0], squares[i][1], squares[i][2], squares[i][3], pallete[bits[i]]);
  }
  
  
  
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


