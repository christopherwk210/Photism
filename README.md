# Photism
An experiment in generating sound from prominent colors in pictures.

## Demo
View the live demo [here](https://christopherwk210.github.io/Photism/).

## Development
Clone and install dependencies:
```
$ git clone https://github.com/christopherwk210/Photism.git
$ cd Photism
$ npm i
```
Run with `npm start` and build with `npm run build`.

## How does it work?
First, the prominant colors are extracted from the image you upload. These colors are then compared to the colors that are resonant with the 12 note letters, which can be found [here](http://www.flutopedia.com/sound_color.htm). The notes that go with the closest colors found are then rendered on a staff.

For a more detailed examination of this implementation and some of the concepts at work here, you can check out my article on this project here (not yet available).

## License
MIT
