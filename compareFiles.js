const fs = require('fs');
const path = require('path');

async function compareFiles(folder1, folder2, outputDirectory) {
  try {
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory);
    }

    const uniqueNames1 = [];
    const uniqueNames2 = [];
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

    for (const fileName1 of fileNames1) {
      if (!fileNames2.includes(fileName1)) {
        uniqueNames1.push({ folder: folder1, fileName: fileName1 });
      }
    }

    for (const fileName2 of fileNames2) {
      if (!fileNames1.includes(fileName2)) {
        uniqueNames2.push({ folder: folder2, fileName: fileName2 });
      }
    }
    const results = uniqueNames1.concat(uniqueNames2);
    const filePath = path.join(outputDirectory, 'results.json');
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    return results;
    
  } catch (error) {
    console.error(error);
    return [];
    
  }
}

compareFiles('D:\\1', 'D:\\2', 'D:\\output').catch(error => console.error(error));
