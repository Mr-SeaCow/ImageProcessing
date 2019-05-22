const { createConverter } = require('convert-svg-to-png');
const fs = require('fs');
const util = require('util');
 
const readdir = util.promisify(fs.readdir);
 
async function convertSvgFiles(dirPath) {
  const converter = createConverter();
 
  try {
    const filePaths = await readdir(dirPath);
    console.log(filePaths)
    for (const filePath of filePaths) {
      console.log(filePath)
      if (filePath !== 'convertSVG.js'){
        await converter.convertFile(filePath);
      }
    }
  } finally {
    await converter.destroy();
  }
}
convertSvgFiles('./')