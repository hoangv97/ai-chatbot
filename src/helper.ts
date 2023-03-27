import { Readability } from '@mozilla/readability';
import axios from 'axios';
import { exec } from 'child_process';
import fs from 'fs';
import https from 'https';
import { JSDOM } from 'jsdom';
import path from 'path';
import { promisify } from 'util';

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const truncate = (str: string, maxLength: number) => {
  return str.length > maxLength
    ? str.slice(0, maxLength) + '...'
    : str
}

export const objectToJsonWithTruncatedUrls = (obj: any) => {
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'string') {
        return truncate(value, 50);
      } else {
        return value;
      }
    },
    2
  );
};

export function splitByFirstSpace(str: string) {
  const index = str.indexOf(' ');
  if (index === -1) {
    return [str];
  } else {
    return [str.slice(0, index), str.slice(index + 1)];
  }
}

export function parseCommand(str: string) {
  if (!str) {
    return null;
  }
  const parts = str.trim().split(/\s+/); // split the string by spaces
  const content = []; // initialize content as an empty array
  const params: any = {}; // initialize params as an empty object

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('--')) { // if the part starts with '--'
      const paramKey = part.slice(2); // get the param name by removing the '--' 
      let paramValue: any = parts[i + 1]; // get the next part as the parameter value

      // if the value is not another param and is defined
      if (!paramValue || paramValue.startsWith('--')) {
        paramValue = true; // set it to true
      } else {
        i++; // move the index of the loop to the next part
      }

      params[paramKey] = paramValue; // set the param key-value pair in the params object
    } else {
      content.push(part); // push the part to content
    }
  }

  return {
    content: content.join(' '), // join content back to string
    params: params,
  };
}


export const getFieldNameByType = (service: any, type: string) => {
  const field = service.params.find((item: any) => item.type === type);
  if (!field) return null;
  return field.name;
};

export function downloadFile(url: string, outputDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const { statusCode } = response;
        const contentType = response.headers['content-type'];

        if (statusCode !== 200) {
          reject(new Error(`Request failed with status code ${statusCode}`));
          return;
        }

        let fileName = (url.split('/').pop() || '').split('?')[0];
        let fileExtension = path.extname(fileName);
        if (fileExtension === '') {
          fileExtension = (contentType || '').split('/')[1];
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

export async function getReadableContentFromUrl(url: string) {
  try {
    const response = await axios.get(url);
    const doc = new JSDOM(response.data, { url }).window.document;
    const reader = new Readability(doc);
    const article = reader.parse();
    const readableContent = article?.textContent?.trim();
    return readableContent;
  } catch (error) {
    console.error(error);
    return null;
  }
}

const asyncExec = promisify(exec);

export const convertOggToMp3 = async (inputFile: string, outputFile: string) => {
  try {
    const { stdout, stderr } = await asyncExec(`ffmpeg -loglevel error -i ${inputFile} -c:a libmp3lame -q:a 2 ${outputFile}`);
    // console.log(stdout);

    if (stderr) {
      console.error(stderr);
    }
  } catch (err) {
    console.error(err);
  }
}

