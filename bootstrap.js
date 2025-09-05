// Polyfill File before any imports
if (typeof File === 'undefined') {
  global.File = class File extends Blob {
    constructor(chunks, filename, options = {}) {
      super(chunks, options);
      this.name = filename;
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

// Now import your main app
import './crawer.js';