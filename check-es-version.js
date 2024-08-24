// Save this as check-es-version.js

console.log(`Node.js version: ${process.version}`);

const features = {
  'ES5': {
    name: 'ECMAScript 5',
    check: () => true  // ES5 is baseline
  },
  'ES2015 (ES6)': {
    name: 'ECMAScript 2015 (ES6)',
    check: () => {
      try {
        eval('() => {}');
        return true;
      } catch (e) {
        return false;
      }
    }
  },
  'ES2016 (ES7)': {
    name: 'ECMAScript 2016 (ES7)',
    check: () => Array.prototype.includes !== undefined
  },
  'ES2017 (ES8)': {
    name: 'ECMAScript 2017 (ES8)',
    check: () => Object.values !== undefined
  },
  'ES2018 (ES9)': {
    name: 'ECMAScript 2018 (ES9)',
    check: () => {
      try {
        eval('async () => {}');
        return true;
      } catch (e) {
        return false;
      }
    }
  },
  'ES2019 (ES10)': {
    name: 'ECMAScript 2019 (ES10)',
    check: () => Array.prototype.flat !== undefined
  },
  'ES2020 (ES11)': {
    name: 'ECMAScript 2020 (ES11)',
    check: () => globalThis !== undefined
  },
  'ES2021 (ES12)': {
    name: 'ECMAScript 2021 (ES12)',
    check: () => Object.prototype.hasOwnProperty.call(Promise, 'any')
  },
  'ES2022 (ES13)': {
    name: 'ECMAScript 2022 (ES13)',
    check: () => Object.prototype.hasOwnProperty.call(Array.prototype, 'at')
  }
};

let highestSupported = 'ES5';

for (const [version, { name, check }] of Object.entries(features)) {
  if (check()) {
    highestSupported = version;
    console.log(`✅ ${name} features are supported`);
  } else {
    console.log(`❌ ${name} features are not supported`);
    break;
  }
}

console.log(`\nHighest supported ECMAScript version: ${features[highestSupported].name}`);