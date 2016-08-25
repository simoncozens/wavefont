# wavefont

A typeface for rendering data: waveforms, spectrums, diagrams, bars etc.

[![wavefont](https://raw.githubusercontent.com/dfcreative/wavefont/gh-pages/preview.png "wavefont")](http://dfcreative.github.io/wavefont/)

The charcodes for the data fall under _Letters_ unicode category, therefore recognized as word boundary in regexps and can be selected by <kbd>Ctrl</kbd> + <kbd>→</kbd> or _double click_ .

Latin set is covered with empty values to allow for recognizing the font by system.


Available styles:

* [x] wavefont-symmetrical
* [ ] wavefont-light
* [x] wavefont-regular
* [ ] wavefont-bold
* [ ] wavefont-dots
* [ ] wavefont-dashes
* [ ] wavefont-outline


## Usage

### As a package

[![npm install wavefont](https://nodei.co/npm/wavefont.png?mini=true)](https://npmjs.org/package/wavefont/)

```js
const includeFont = require('wavefont');

//register 'wavefont' font-face based on options, unnecessary
let fromAmp = includeFont({
	//bars or dots
	type: 'bars',

	//symmetrical mode
	reflect: false,

	//normal for 1/32, light for 1/64, bold for 1/16, bolder for 1/8
	weight: 'normal',

	//@font-face properties
	css: `
		font-name: wavefont;
		font-weight: normal;
		font-style: normal;
	`
});

let input = document.body.appendChild(document.createElement('input'));
input.style.fontFamily = 'wavefont';

//fromAmp gets symbol corresponding to value from -1..1 range
input.value = [-1, -.75, -.5, -.25, 0, .25, .5, .75, 1].map(fromAmp);
```


### As a web-font

Include font as `@font-face` directive:

```css
@font-face {
	font-family: "wavefont";
	font-weight: normal;
	src: url("./wavefont-bars.otf");
}
```

There are 256 characters available for the levels of amplitude from `-128..127` range.
Use `0x200` offset for `0` level of amplitude:

```js
//Strings
'\u0180'; //-128
//...
'\u01fe'; //-1
'\u01ff'; //-1
'\u0200'; //0
'\u0201'; //1
'\u0202'; //2
//...
'\u027f'; //127

//ES6 strings
`\u{200}`; //0
`\u{201}`; //1
//...
`\u{27f}`; //127

//Programmatically
let char = String.fromCharCode(0x200 + level);
```

Or you can use [add-font](https://npmjs.org/package/font) package, which inserts font to css from url or as a buffer.


## Building

To build or debug own wavefont:

[![npm install wavefont](https://nodei.co/npm/wavefont.png?mini=true)](https://npmjs.org/package/wavefont/)

You get builder function, available in node or browser:

```js
const createFont = require('wavefont');

let font = createFont({
	name: 'wavefont',

	//append to the end of the name, e.g. `-bold`
	postfix: '',

	//letter-spacing
	spacing: 0,

	//letter width/height proportion
	ratio: 1/64,

	//unicode range start
	//ideally the letter range, good ones (for 255 levels):
	//0x0100, 0x1100, 0x1500 0x1e00, 0xa000, 0xb000, 0xc000, 0xd000
	//symmetrical offset is 0x0200
	offset: 0x0200,

	//number of amplitude levels
	//values span from -128..-1 and 0..127
	levels: 256,

	//symmetrical mode
	reflect: false,

	//style - bars or dots
	type: 'bars',

	//values outside the amplitude range
	clip: 1.5,

	//width for spacers
	shortWidth: .15
});
```

`font` now is an _opentype.Font_ instance, you can attach it to window fonts with [add-font](https://npmjs.org/package/add-font), output to stdout, download etc, see [opentype.js](https://github.com/nodebox/opentype.js) for reference.


## Credits

> [opentype.js](https://github.com/nodebox/opentype.js) — covers technical details of generating OpenType font.<br/>