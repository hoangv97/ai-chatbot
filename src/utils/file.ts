import { exec } from 'child_process';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { promisify } from 'util';

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

export const convertOggToWav = async (inputFile: string, outputFile: string) => {
  try {
    const { stdout, stderr } = await asyncExec(`ffmpeg -loglevel error -i ${inputFile} ${outputFile}`);
    // console.log(stdout);

    if (stderr) {
      console.error(stderr);
    }
  } catch (err) {
    console.error(err);
  }
}

export const encodeOggWithOpus = async (inputFile: string, outputFile: string) => {
  try {
    const { stdout, stderr } = await asyncExec(`ffmpeg -loglevel error -i ${inputFile} -c:a libopus -b:a 96K ${outputFile}`);
    // console.log(stdout);

    if (stderr) {
      console.error(stderr);
    }
  } catch (err) {
    console.error(err);
  }
}

export const deleteDownloadFile = (filePath: string) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.log(err)
    };
    // console.log(`${filePath} was deleted`);
  })
}

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