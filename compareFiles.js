const { count } = require('console');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const util = require('util');

async function compareFiles(folder1, folder2, outputDirectory) {
  try {
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory);
    }
    const fileNames1 = await new Promise((resolve, reject) => {
      fs.readdir(folder1, (error, files) => {
        if (error) {
          reject(error);
        } else {
          resolve(files);
        }
      });
    });
    const fileNames2 = await new Promise((resolve, reject) => {
      fs.readdir(folder2, (error, files) => {
        if (error) {
          reject(error);
        } else {
          resolve(files);
        }
      });
    });

    const compareStream = new stream.Transform({
      objectMode: true,
      transform(fileName1, encoding, callback) {
        if (!fileNames2.includes(fileName1)) {
          this.push({ folder: folder1, fileName: fileName1 });
        }
        callback();
      },
    });

    const compareStream2 = new stream.Transform({
      objectMode: true,
      transform(fileName2, encoding, callback) {
        if (!fileNames1.includes(fileName2)) {
          this.push({ folder: folder2, fileName: fileName2 });
        }
        callback();
      },
    });

    fileNames1.forEach((fileName) => compareStream.write(fileName));
    compareStream.end();

    fileNames2.forEach((fileName) => compareStream2.write(fileName));
    compareStream2.end();

    const results = [];
    compareStream.on('data', (data) => results.push(data));
    compareStream2.on('data', (data) => results.push(data));

    await util.promisify(stream.finished)(compareStream);
    await util.promisify(stream.finished)(compareStream2);
  
    const filePath = path.join(outputDirectory, 'results.json');
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

    console.log(`Unique files in folder1: ${results.filter(result => result.folder === folder1).length}`);
    console.log(`Unique files in folder2: ${results.filter(result => result.folder === folder2).length}`);
    console.log(`Total unique files: ${results.length}`);
    
    return results;
  } catch (error) {
    console.error(error);
    return [];
  }
}

compareFiles('D:\\1', 'D:\\2', 'D:\\output').catch(error => console.error(error));

