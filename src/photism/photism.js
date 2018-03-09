// Note/color relationships derived from http://www.flutopedia.com/sound_color.htm
import noteMap from './noteMap';

/**
 * Returns the average of all given numbers
 * @param {...number} nums 
 */
Math.mean = function(...nums) {
  let sum = 0;
  nums.forEach(num => sum += num);
  return sum / nums.length;
}

/**
 * Convert RGB values into a note
 * @param {number} r Red value
 * @param {number} g Green value
 * @param {number} b Blue value
 */
function colorToNote(r, g, b) {
  // Determine differences in note map colors
  let noteAlikeness = {};
  for (let note in noteMap) {
    if (noteMap.hasOwnProperty(note)) {
      noteAlikeness[note] = Math.mean(
        Math.abs(noteMap[note].r - r),
        Math.abs(noteMap[note].g - g),
        Math.abs(noteMap[note].b - b)
      );
    }
  }

  // Find the one we are closest to
  let mostAlikeNote = 'A';
  for (let note in noteAlikeness) {
    if (noteAlikeness.hasOwnProperty(note)) {
      if (noteAlikeness[note] < noteAlikeness[mostAlikeNote]) {
        mostAlikeNote = note;
      }
    }
  }

  return mostAlikeNote;
}

export const Photism = {colorToNote};
