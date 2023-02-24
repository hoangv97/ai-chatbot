const https = require('https');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const axios = require('axios');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const objectToJsonWithTruncatedUrls = (obj) => {
  const MAX_URL_LENGTH = 50;
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'string' && value.startsWith('http')) {
        return value.length > MAX_URL_LENGTH
          ? value.slice(0, MAX_URL_LENGTH) + '...'
          : value;
      } else {
        return value;
      }
    },
    2
  );
};

function splitByFirstSpace(str) {
  const index = str.indexOf(' ');
  if (index === -1) {
    return [str];
  } else {
    return [str.slice(0, index), str.slice(index + 1)];
  }
}

const getFieldNameByType = (service, type) => {
  const field = service.params.find((item) => item.type === type);
  if (!field) return null;
  return field.name;
};

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

async function getReadableContentFromUrl(url) {
  try {
    const response = await axios.get(url);
    const doc = new JSDOM(response.data, { url }).window.document;
    const reader = new Readability(doc);
    const article = reader.parse();
    const readableContent = article.textContent;
    return readableContent;
  } catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = {
  sleep,
  objectToJsonWithTruncatedUrls,
  splitByFirstSpace,
  getFieldNameByType,
  downloadFile,
  getReadableContentFromUrl,
};
