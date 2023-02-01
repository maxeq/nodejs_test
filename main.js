const fs = require("fs");
const { promisify } = require("util");
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);

const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;


async function main() {
  const numFiles = 1000000;
  const folder1 = "D:\\1";
  const folder2 = "D:\\2";

  await Promise.all([createFiles(folder1, numFiles), createFiles(folder2, numFiles)]);
  console.log("Files created successfully!");

  const result = await compareFiles(folder1, folder2);
  console.log(`Number of unique names in folder1 ${folder1}: ${result_compare.uniqueNames1.length}`);
  console.log(`Number of unique names in folder2 ${folder2}: ${result_compare.uniqueNames2.length}`);


  await Promise.all([createFiles(folder1, numFiles), createFiles(folder2, numFiles)]);
  console.log("Files created successfully!");

  const result_compare = await compareFiles(folder1, folder2);
  console.log(`Number of unique names in folder1 ${folder1}: ${result_compare.uniqueNames1.length}`);
  console.log(`Number of unique names in folder2 ${folder2}: ${result_compare.uniqueNames2.length}`);

  if (Array.isArray(result_compare.uniqueNames1)) {
    await storeFileNamesInDb(folder1, result_compare.uniqueNames1);
  }

  if (Array.isArray(result_compare.uniqueNames2)) {
    await storeFileNamesInDb(folder2, result_compare.uniqueNames2);
  }
}

async function storeFileNamesInDb(folderName, fileNames) {
  const client = new MongoClient(database_key, { useUnifiedTopology: true });
  try {
    await client.connect();

    const db = client.db("folders");
    const collection = db.collection(folderName);

    for (const fileName of fileNames) {
      const existingFile = await collection.findOne({ name: fileName });
      if (!existingFile) {
        const file = {
          folder: folderName,
          name: fileName
        };
        await collection.insertOne(file);
      }
    }
    console.log(`Filename stored: ${fileNames}, Stored total: ${fileNames.length}`);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

async function createFiles(folder, numFiles) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  for (let i = 0; i < numFiles; i++) {
    const filePath = `${folder}/file-${i}.txt`;
    if (!fs.existsSync(filePath)) {
      await writeFile(filePath, "This is a text file");
    }
  }
}

async function compareFiles(folder1, folder2) {
  try {
    const uniqueNames1 = [];
    const uniqueNames2 = [];
    const fileNames1 = await readdir(folder1);
    const fileNames2 = await readdir(folder2);

    for (const fileName1 of fileNames1) {
      if (!fileNames2.includes(fileName1)) {
        uniqueNames1.push(fileName1);
      }
    }

    for (const fileName2 of fileNames2) {
      if (!fileNames1.includes(fileName2)) {
        uniqueNames2.push(fileName2);
      }
    }

    return { uniqueNames1, uniqueNames2 };
  } catch (error) {
    console.error(error);
    return {};
  }
}

const listFilesinDB = async () => {
  const client = new MongoClient(database_key, { useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db('folders');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(collection => collection.name);
    const filenames = [];
    const countPerCollection = {};
    for (const collectionName of collectionNames) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      countPerCollection[collectionName] = count;
      const documents = await collection.find({}).toArray();
      for (const document of documents) {
        filenames.push(document.name);
      }
    }
    console.log("File names: ", filenames);
    console.log("Files count per collection: ", countPerCollection);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
};

async function removeFilesFromDb(filePath) {
  const client = new MongoClient(database_key, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db('folders');
  const fileNames = fs.readFileSync(filePath, 'utf8').split('\n');

  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    const coll = db.collection(collection.name);
    for (const fileName of fileNames) {
      const result = await coll.deleteMany({ name: fileName });
      console.log(`Deleted ${result.deletedCount} file(s) from collection "${collection.name}"`);
    }
  }

  await client.close();
}


//main().catch(error => console.error(error));
//listFilesinDB().catch(error => console.error(error));
//removeFilesFromDb("D:\\1\\file_names.txt");
