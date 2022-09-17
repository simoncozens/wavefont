const dedent = require('dedent')

// const UPM = 2048
const UPM = 1000

// Latin-core (with some bad exceptions)
const ZERO_CHAR = `\x00\x01\x02\x03\x04\x05\x06\x07\b\t\n\v\f\r\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F !"#$%&\'()/:;<=>?@[\\]^\`{}~\x7F\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþıŒœʻʼˆ˚˜‖‗‘’‚‛“”„‟†‡•‣․‥…‧ ‰‱′″‴‵‶‷‸‹›※‼‽‾‿⁀⁁⁂⁃⁄⁅⁆⁇⁈⁉⁊⁋⁌⁍⁎⁏⁐⁑⁒⁓⁔⁕⁖⁗⁘ɴ™↑↓∕`
const ONE_CHAR = `*+,-._~‐‑‒–—―−`
const MAX_CHAR = `|`
const BAR_CHAR = `▁▂▃▄▅▆▇█`
const LOWCASE_CHAR = `abcdefghijklmnopqrstuvwxyz`
const UPCASE_CHAR = `ABCDEFGHIJKLMNOPQRSTUVWXYZ`
const DIGIT_CHAR = `0123456789`

const FONTFACE = {
  name: 'wavefont',
  min: 0,
  max: 100,
  alias: {
    0: [...ZERO_CHAR],
    1: [...ONE_CHAR, BAR_CHAR[0]],
    14: [BAR_CHAR[1]], 28: [BAR_CHAR[2]], 42: [BAR_CHAR[3]], 56: [BAR_CHAR[4]], 72: [BAR_CHAR[5]], 86: [BAR_CHAR[6]],
    100: [...MAX_CHAR, BAR_CHAR[7]]
  },
  values: Array.from({length: 108}).map((v,i)=>(0x0100 + i))
}
LOWCASE_CHAR.forEach((char,i) => (FONTFACE.alias[(i+1)*4 + .5]||=[]).push(char.charCodeAt(0)))
UPCASE_CHAR.forEach((char,i) => (FONTFACE.alias[(i+1)*4]||=[]).push(char.charCodeAt(0)))
DIGIT_CHAR.forEach((char,i) => (FONTFACE.alias[i*10]||=[]).push(char.charCodeAt(0)))

const AXIS = {
  // advance width in fact
  width: {tag: 'wdth', min: 1, max: 1000, default: 1},

  // 400 weight value is required by google fonts
  // too large values don't make much sense here and just bloats size
  weight: {tag: 'wght', min: 1, max: 400, default: 1},

  // we redistribute center alignment under capcase and cyrillic ranges
  // align: {tag: 'ALGN', min: 0, max: 1, default: 0},

  // softness is closest by meaning axis name
  radius: {tag: 'SOFT', min: 0, max: 50, default: 0}
}

module.exports = function (plop) {
	plop.setGenerator('build-ufo', {
    description: 'Build font-face UFOs',
    prompts: [{name: 'faceName', message: 'font-face name', type: 'text'}],
		actions: ({faceName}) => {
      const face = FONTFACE[faceName], axes = AXIS

      // convert value to units-per-em (0-100 → 0-2048)
      const upm = (v) => (UPM * v / face.max)
      // int to 4-digit hex
      const hex = (v) => v.toString(16).toUpperCase().padStart(4,0)
      // int to u0000 form
      const uni = (v) => Array.isArray(v) ? v.map(v => `u${hex(parseInt(v))}`).join(',') : `u${hex(parseInt(v))}`

      // uni 1 → uni0001
      plop.setHelper('uni', uni);

      // upm x →
      plop.setHelper('upm', upm);

      // hex x →
      plop.setHelper('hex', hex);

      // sub 1 2 → -1
      plop.setHelper('sub', (a,b) => a-b);

      // half 1 → .5
      plop.setHelper('half', (a) => a*.5);

      // int 12.3 → 12
      plop.setHelper('int', v => v.toFixed(3))

      // variable font axes
      const {width, weight, align, radius} = axes

      // clip values are more horizontal than vertical - need alternative glyph
      const clips = face.values.filter((c, v) => upm(v) < AXIS.width.max)

      // create master cases
      const masters = {}
      const k = (w=1,b,r) => `w${w}b${b}r${r}`, v = (w=1,b,r) => ({width:w, weight:b, radius:r})
      masters[k(width.min, weight.min, align.max, radius.min)] = v(width.min, weight.min, align.max, radius.min)
      masters[k(width.min, weight.min, align.max, radius.max)] = v(width.min, weight.min, align.max, radius.max)
      masters[k(width.min, weight.max, align.max, radius.min)] = v(width.min, weight.max, align.max, radius.min)
      masters[k(width.min, weight.max, align.max, radius.max)] = v(width.min, weight.max, align.max, radius.max)
      masters[k(width.max, weight.min, align.max, radius.min)] = v(width.max, weight.min, align.max, radius.min)
      masters[k(width.max, weight.min, align.max, radius.max)] = v(width.max, weight.min, align.max, radius.max)
      masters[k(width.max, weight.max, align.max, radius.min)] = v(width.max, weight.max, align.max, radius.min)
      masters[k(width.max, weight.max, align.max, radius.max)] = v(width.max, weight.max, align.max, radius.max)

      return [
        // populate source skeleton
        {
          type: 'addMany',
          force: true,
          destination: `build/${faceName}/`,
          base: 'sources/wavefont',
          templateFiles: 'sources/wavefont/*',
          data: { face, masters, axes, clips }
        },
        ...Object.keys(masters).map(name => master({name, ...masters[name]})).flat()
      ]

      // actions to build one master file
      function master({name, weight, align, width, radius}){
        const destination = `build/${face.name}/${name}.ufo`
        return [
          // ufo skeleton
          {
            type: 'addMany',
            force: true,
            destination: `${destination}/`,
            base: 'sources/wavefont/master.ufo',
            templateFiles: 'sources/wavefont/master.ufo/**/*',
            data: { width, weight, align, radius, axes, face, clips }
          },
          // caps
          {
            force: true,
            type: 'add',
            path: `${destination}/glyphs/cap.glif`,
            // radius converts from percent to upm
            template: cap({height: radius*.01*weight*2, width:0, radius: radius*.01*weight, weight, name: 'cap', align: 0 })
          },
          // values
          ...face.values.map((code, value) => ({
            force: true,
            type: 'add',
            path: `${destination}/glyphs/${value}.glif`,
            template: bar({value, code, weight, width, name: `_${value}`, capSize: radius*.01*weight, align })
          })),
          // substitute glyphs lower than max weight to compensate wrong interpolation on weight clipping
          // the logic: big weights would have big radius, but since it's limited to value, we interpolate between wrong 1 weight and max weight
          ...clips.map((code, value) => value && ({
            force: true,
            type: 'add',
            path: `${destination}/glyphs/${value}.clip.glif`,
            template: cap({height: upm(value), weight, width, name: `_${value}.clip`, radius: (radius && 1 ) * upm(value) * .5, align })
          })).filter(Boolean)
        ]
      }

      // cap glyph builder
      function cap({width, weight, height, name, code, radius:R, align}) {
        // bezier curve shift to approximate border-radius
        const Rc = R * (1 - .55), yshift = (UPM - height) * align,
              mid = width * .5, l = mid - weight*.5, r = mid + weight*.5

        return dedent`
          <?xml version="1.0" encoding="UTF-8"?>
          <glyph name="${name}" format="2">
            <advance width="${width}"/>
            ${code ? `<unicode hex="{{hex ${code} }}"/>` : ``}
            <outline>
              <contour>
                  <point x="{{int ${l}}}" y="{{int ${height-Rc + yshift} }}"/>

                  <point x="{{int ${l+Rc} }}" y="{{int ${height + yshift} }}"/>
                  <point x="{{int ${l+R} }}" y="{{int ${height + yshift} }}" type="curve" smooth="yes"/>
                  <point x="{{int ${r-R} }}" y="{{int ${height + yshift} }}" type="line"/>
                  <point x="{{int ${r-Rc} }}" y="{{int ${height + yshift} }}"/>

                  <point x="{{int ${r} }}" y="{{int ${height-Rc + yshift} }}"/>
                  <point x="{{int ${r} }}" y="{{int ${height-R + yshift} }}" type="curve" smooth="yes"/>
                  <point x="{{int ${r} }}" y="{{int ${R + yshift} }}" type="line"/>
                  <point x="{{int ${r} }}" y="{{int ${Rc + yshift} }}"/>

                  <point x="{{int ${r-Rc} }}" y="{{int ${0 + yshift} }}"/>
                  <point x="{{int ${r-R} }}" y="{{int ${0 + yshift} }}" type="curve" smooth="yes"/>
                  <point x="{{int ${l+R} }}" y="{{int ${0 + yshift} }}" type="line"/>
                  <point x="{{int ${l+Rc} }}" y="{{int ${0 + yshift} }}"/>

                  <point x="{{int ${l} }}" y="{{int ${Rc + yshift} }}"/>
                  <point x="{{int ${l} }}" y="{{int ${R + yshift} }}" type="curve" smooth="yes"/>
                  <point x="{{int ${l} }}" y="{{int ${height-R + yshift} }}" type="line"/>
              </contour>
            </outline>
          </glyph>
        `
      }

      // bar glyph builder
      function bar({value, code, width, weight, capSize, name, align}) {
        const yshift = upm((face.max - value) * align),
              mid = width * .5, l = mid - weight*.5, r = mid + weight*.5
        return dedent`
          <?xml version="1.0" encoding="UTF-8"?>
          <glyph name="${name}" format="2">
            <advance width="${width}"/>
            ${code ? `<unicode hex="{{hex ${code} }}"/>` : ``}
            ${face.alias[value]?.map(code => `<unicode hex="{{hex ${code} }}"/>`).join('') || ``}
            ${value ? `<outline>
              <component base="cap" xOffset="{{int ${mid}}}" yOffset="{{int ${yshift}}}" />
              <component base="cap" xOffset="{{int ${mid}}}" yOffset="{{int ${upm(value) - capSize*2 + yshift}}}" />
              <contour>
                <point x="{{int ${l}}}" y="{{int ${yshift + capSize}}}" type="line"/>
                <point x="{{int ${l}}}" y="{{int ${upm(value) + yshift - capSize}}}" type="line"/>
                <point x="{{int ${r}}}" y="{{int ${upm(value) + yshift - capSize}}}" type="line"/>
                <point x="{{int ${r}}}" y="{{int ${yshift + capSize}}}" type="line"/>
              </contour>
            </outline>` : ``}
          </glyph>
        `
      }
    }
  });
}
