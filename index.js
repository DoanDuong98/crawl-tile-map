const fs = require('fs');
const axios = require('axios');
const path = require('path');

const downloadTile = async (z, x, y, folder) => {
  const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  const dir = path.join(folder, `${z}/${x}`);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, `${y}.png`);

  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Failed to download tile ${z}/${x}/${y}: ${error.message}`);
  }
};

const processBatch = async (tasks, batchSize) => {
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    await Promise.all(batch);
  }
};

const downloadTilesForVietnam = async (zoomLevels, xMin, xMax, yMin, yMax, folder) => {
  const tasks = [];

  for (let z of zoomLevels) {
    for (let x = xMin[z]; x <= xMax[z]; x++) {
      for (let y = yMin[z]; y <= yMax[z]; y++) {
        // const task = downloadTile(z, x, y, folder);
        // tasks.push(task);
        await downloadTile(z, x, y, folder);
        console.log(`Downloaded tile ${z}/${x}/${y}`);
      }
    }
  }

  await processBatch(tasks, 10);
  console.log('Finished downloading all tiles!');
};

const zoomLevels = [5, 6, 7];

const xMin = {
  5: 23,
  6: 45,
  7: 94
};
const xMax = {
  5: 27,
  6: 66,
  7: 111
};
const yMin = {
  5: 12,
  6: 25,
  7: 52
};
const yMax = {
  5: 15,
  6: 33,
  7: 62
};

const outputFolder = 'tiles';

downloadTilesForVietnam(zoomLevels, xMin, xMax, yMin, yMax, outputFolder)
  .then(() => console.log('Finished downloading tiles for Vietnam!'))
  .catch((err) => console.error('Error downloading tiles:', err));
