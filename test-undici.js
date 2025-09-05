if (typeof File === 'undefined') {
  global.File = class File extends Blob {
    constructor(chunks, filename, options = {}) {
      super(chunks, options);
      this.name = filename;
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

import('undici').then(u => {
  console.log('Undici loaded, File is defined:', typeof File !== 'undefined');
}).catch(console.error);