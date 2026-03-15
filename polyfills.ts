// This file must be imported first to set up necessary polyfills
import { decode, encode } from "base-64";
import CryptoJS from "crypto-js";
import "react-native-get-random-values";

// Set up base64 polyfills for atob and btoa
if (typeof global !== "undefined") {
  if (!global.atob) {
    global.atob = decode;
  }
  if (!global.btoa) {
    global.btoa = encode;
  }
}

// Set up custom random word generator for CryptoJS as a fallback
if (typeof global !== "undefined") {
  // Ensure crypto.getRandomValues is available globally
  if (!global.crypto) {
    global.crypto = {} as any;
  }

  if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = (array: any) => {
      // Fallback using Math.random (less secure but works)
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
  }
}

// Override CryptoJS random word generation to use our polyfill
const originalRandom = CryptoJS.lib.WordArray.random;
CryptoJS.lib.WordArray.random = function (nBytes: number) {
  try {
    // Try to use the native implementation first
    return originalRandom.call(this, nBytes);
  } catch (error) {
    // Fallback: generate random words using Math.random
    const words: number[] = [];
    for (let i = 0; i < nBytes; i += 4) {
      words.push((Math.random() * 0x100000000) | 0);
    }
    return CryptoJS.lib.WordArray.create(words, nBytes);
  }
};

// Polyfills are now loaded
console.log("Polyfills loaded successfully");
