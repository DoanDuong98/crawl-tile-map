const fs = require("fs");
const axios = require("axios");
const path = require("path");
const { xMax, xMin, yMax, yMin, zoomLevels } = require("./service");

const downloadTile = async (z, x, y, folder) => {
  const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  const dir = path.join(folder, `${z}/${x}`);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, `${y}.png`);

  try {
    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream",
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
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

const downloadTiles = async (zoomLevels, xMin, xMax, yMin, yMax, folder) => {
  const tasks = [];

  for (let z of zoomLevels) {
    for (let x = xMin[z]; x <= xMax[z]; x++) {
      for (let y = yMin[z]; y <= yMax[z]; y++) {
        const task = downloadTile(z, x, y, folder).then(() => {
          console.log(`Downloaded tile ${z}/${x}/${y}`);
        });
        tasks.push(task);
      }
    }
  }

  await processBatch(tasks, 10); // xử lý theo batch 10 tile một lúc
  console.log("Finished downloading all tiles!");
};

const outputFolder = "tiles";

downloadTiles(zoomLevels, xMin, xMax, yMin, yMax, outputFolder)
  .then(() => console.log("Finished downloading tiles!"))
  .catch((err) => console.error("Error downloading tiles:", err));
