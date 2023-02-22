const https = require('https');
const fs = require('fs');
const path = require('path');

function downloadFile(url, outputDir) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const { statusCode } = response;
        const contentType = response.headers['content-type'];

        if (statusCode !== 200) {
          reject(new Error(`Request failed with status code ${statusCode}`));
          return;
        }

        let fileName = url.split('/').pop().split('?')[0];
        let fileExtension = path.extname(fileName);
        if (fileExtension === '') {
          fileExtension = contentType.split('/')[1];
        }

        const outputPath = path.join(outputDir, fileName);

        const writeStream = fs.createWriteStream(outputPath);
        response.pipe(writeStream);

        writeStream.on('finish', () => {
          writeStream.close(() => {
            resolve(outputPath);
          });
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

module.exports = {
  downloadFile,
};
