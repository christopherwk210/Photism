import 'babel-polyfill';
import $ from 'jquery';
import * as Vex from 'vexflow';
import * as Vibrant from 'node-vibrant';
import * as Pizzicato from 'pizzicato';

import { Photism } from './photism/photism';

let waves = [];

window.noteConfig = {};

$(document).ready(() => {
  // Grab elements
  let fileInput = $('#image-file');
  let canvas = $('#image-canvas');

  // Size canvas approariately
  canvas[0].width = 400;
  canvas[0].height = 400;

  /** @type {CanvasRenderingContext2D} */
  let ctx = canvas[0].getContext('2d');

  // Listen for file inputs
  fileInput.on('change', e => {
    let reader = new FileReader();

    reader.onload = e => {
      let img = $('<img>');

      // Draw image to canvas on load
      img.on('load', () => {
        ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);        
        drawImageFit(img[0], canvas[0], ctx);
        getImagePalette(img[0]);
      });

      img.attr('src', e.target.result);
    };

    // Read image
    reader.readAsDataURL(e.target.files[0]);
  });
});

/**
 * Creates a Pz sine wave
 * @param {*} note 
 */
function createWave(note) {
  let sineWave = new Pizzicato.Sound({ 
    source: 'wave',
    options: {
      frequency: getFrequency(note)
    }
  });
  
  sineWave.attack = 0.5;
  sineWave.release = 0.25;

  return sineWave;
}

/**
 * Returns a frequency for a given note, source:
 * https://gist.github.com/stuartmemo/3766449
 * @param {string} note 
 */
function getFrequency(note) {
  let notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'],
      octave,
      keyNumber;

  if (note.length === 3) {
      octave = note.charAt(2);
  } else {
      octave = note.charAt(1);
  }

  keyNumber = notes.indexOf(note.slice(0, -1));

  if (keyNumber < 3) {
      keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1; 
  } else {
      keyNumber = keyNumber + ((octave - 1) * 12) + 1; 
  }

  // Return frequency of note
  return 440 * Math.pow(2, (keyNumber- 49) / 12);
}

/**
 * Renders notation for the given notes
 * @param {string[]} notes 
 */
function renderNotes(notes) {
  $('#notation').empty();

  if (notes.length < 1) {
    return;
  }

  let vf = new Vex.Flow.Factory({
    renderer: {
      elementId: 'notation',
      width: 200,
      height: 200
    }
  });
  
  let score = vf.EasyScore();
  let system = vf.System();

  let voices = [];
  notes.forEach(note => {
    voices.push(score.voice(score.notes(`${note}/w`)))
  });
  
  system.addStave({ voices }).addClef('treble');
  
  vf.draw();
}

/**
 * Gets the prominent colors from an image element and adds the colors to the page
 * @param {HTMLImageElement} img 
 */
function getImagePalette(img) {
  let paletteContainer = $('#palette');
  paletteContainer.empty();

  let imageNotes = [];

  // Get swatches
  Vibrant.from(img).getPalette().then(palette => {
    window.noteConfig = {};
    let existingNotes = [];

    for (let swatch in palette) {
      if (palette.hasOwnProperty(swatch) && palette[swatch]) {
        // Get color values
        let color = palette[swatch];
        let rgbstr = `rgb(${color.r}, ${color.g}, ${color.b})`;

        // Add color swatch element
        let colorElement = $('<div>').addClass('swatch');
        colorElement.css('background', rgbstr);
        paletteContainer.append(colorElement);

        // Determine note
        let note = Photism.colorToNote(color.r, color.g, color.b);
        imageNotes.push(note);
        let finalNote = note + (~existingNotes.indexOf(note) ? '5' : '4');

        // Save note to element
        colorElement.attr('data-note', finalNote);

        // Save selected note state
        window.noteConfig[finalNote] = {
          enable: () => {
            window.noteConfig[finalNote].enabled = true;
            window.noteConfig[finalNote].element.addClass('active');
            renderActiveNotes();
            createWavesForActiveNotes();
            createPlayButton();
          },
          disable: () => {
            window.noteConfig[finalNote].enabled = false;
            window.noteConfig[finalNote].element.removeClass('active');
            renderActiveNotes();
            createWavesForActiveNotes();
            createPlayButton();
          },
          enabled: false,
          element: colorElement,
          color
        };

        // Allow note toggling
        colorElement.click(() => {
          if (window.noteConfig[finalNote].enabled) {
            window.noteConfig[finalNote].disable();
          } else {
            window.noteConfig[finalNote].enable();
          }
        });

        existingNotes.push(note);
      }
    }

    // Enable 3 by default
    let iter = 0;
    let maxDefaultEnable = 3;
    for (let note in window.noteConfig) {
      if (window.noteConfig.hasOwnProperty(note) && iter < maxDefaultEnable) {
        window.noteConfig[note].enable();
        iter++;
      }
    }
  });
}

function createPlayButton() {
  $('.play-container').empty();

  let button = $('<button>').text('play');
  button.click(() => {
    if (button.text() === 'play') {
      button.text('stop');
      waves.forEach(wave => {
        wave.volume = 0.5;
        wave.play();
      });
    } else {
      button.text('play');
      waves.forEach(wave => {
        wave.stop();
      });
    }
  });

  $('.play-container').append(button);
}

/**
 * Creates Pz waves for every active note
 */
function createWavesForActiveNotes() {
  waves.forEach(wave => wave.stop());
  waves = [];
  for (let note in window.noteConfig) {
    if (window.noteConfig.hasOwnProperty(note)) {
      if (window.noteConfig[note].enabled) {
        waves.push(createWave(note));
      }
    }
  }
}

/**
 * Renders currently active notes in the noteConfig
 */
function renderActiveNotes() {
  let notes = [];
  for (let note in window.noteConfig) {
    if (window.noteConfig.hasOwnProperty(note)) {
      if (window.noteConfig[note].enabled) {
        notes.push(note);
      }
    }
  }

  renderNotes(notes);
}

/**
 * Draws an image element to a canvas, centered and scaled to fit
 * @param {HTMLImageElement} img 
 * @param {HTMLCanvasElement} canvas 
 * @param {CanvasRenderingContext2D} ctx 
 */
function drawImageFit(img, canvas, ctx) {
  let newWidth = img.width;
  let newHeight = img.height;

  let canvasWidth = canvas.width;
  let canvasHeight = canvas.height;

  let ratio = newWidth / newHeight;
  let left = 0;
  let top = 0;

  if (newHeight > canvasHeight || newWidth > canvasWidth) {
    if (newHeight > canvasHeight) {
      newHeight = canvasHeight;
      newWidth = canvasHeight * ratio;
      left = -(newWidth - canvasWidth) / 2;
    } else if (newWidth > canvasWidth) {
      newHeight = canvasWidth / ratio;
      newWidth = canvasWidth;
      top = -(newHeight - canvasHeight) / 2;
    }
  } else {
    left = -(newWidth - canvasWidth) / 2;
    top = -(newHeight - canvasHeight) / 2;
  }
  
  ctx.drawImage(img, 0, 0, img.width, img.height, left, top, newWidth, newHeight);
}
