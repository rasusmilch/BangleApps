(function(back) {
  const SETTINGS_FILE = "fiboclk.json";

  // TODO Only the color/theme indices should be written in the settings file so the labels can be translated

  // Initialize with default settings...
  let s = {'hourcode': '#f00', 'hourcolor': 'Red', 'mincode' : '#0f0', 'mincolor' : 'Green', 'bothcode' : '#00f', 'bothcolor' : 'Blue','emptycode' : '#ff0', 'emptycolor' : 'Orange', 'showtime' : false};

  // ...and overwrite them with any saved values
  // This way saved values are preserved if a new version adds more settings
  const storage = require('Storage');
  let settings = storage.readJSON(SETTINGS_FILE, 1) || s;
  const saved = settings || {};
  for (const key in saved) {
    s[key] = saved[key];
  }

  function save() {
    settings = s;
    storage.write(SETTINGS_FILE, settings);
  }

  var color_options = ['Green','Orange','Cyan','Purple','Red','Blue','White','Black'];
  var color_code = ['#0f0','#ff0','#0ff','#f0f','#f00','#00f','#fff','#000'];
  
  E.showMenu({
    '': { 'title': 'Fibonacci Clock' },
    /*LANG*/'< Back': back,
    /*LANG*/'Hours Color': {
      value: 0 | color_options.indexOf(s.hourcolor),
      min: 0, max: 7,
      format: v => color_options[v],
      onchange: v => {
        s.hourcolor = color_options[v];
        s.hourcode = color_code[v];
        save();
      }
    },
    /*LANG*/'Mins Color': {
      value: 0 | color_options.indexOf(s.mincolor),
      min: 0, max: 7,
      format: v => color_options[v],
      onchange: v => {
        s.mincolor = color_options[v];
        s.mincode = color_code[v];
        save();
      }
    },

    /*LANG*/'Both Color': {
      value: 0 | color_options.indexOf(s.bothcolor),
      min: 0, max: 7,
      format: v => color_options[v],
      onchange: v => {
        s.bothcolor = color_options[v];
        s.bothcode = color_code[v];
        save();
      }
    },
    /*LANG*/'Empty Color': {
      value: 0 | color_options.indexOf(s.emptycolor),
      min: 0, max: 7,
      format: v => color_options[v],
      onchange: v => {
        s.emptycolor = color_options[v];
        s.emptycode = color_code[v];
        save();
      }
    },
    /*LANG*/'Show Time': {
      value: settings.showtime,
      onchange: () => {
        settings.showtime = !settings.showtime;
        save();
      }
    },
  });
});
