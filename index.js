const fs = require("fs").promises;
const path = require("path");

const getFileTree = async (dirPath) => {
  try {
    const resolvedPath = path.resolve(dirPath);
    await fs.access(resolvedPath);
    
    const stats = await fs.stat(resolvedPath);
    
    if (stats.isFile()) {
      return [await getFileMetadata(resolvedPath)];
    } else if (stats.isDirectory()) {
      const files = await fs.readdir(resolvedPath);
      const fileDetailsPromises = files.map((file) =>
        getFileMetadata(path.join(resolvedPath, file))
      );

      const fileDetails = await Promise.all(fileDetailsPromises);
      return fileDetails.sort((a, b) => a.fileName.localeCompare(b.fileName));
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw new Error("Invalid Path");
  }
};

const getFileMetadata = async (filePath) => {
  const stats = await fs.stat(filePath);
  const createdAt = dateFormat(stats.birthtimeMs);
  
  const projectRoot = path.resolve(__dirname);
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, "/");
  const formattedPath = `/${relativePath.replace(/^(..\/)+/, "")}`;
  
  return {
    fileName: path.basename(filePath),
    filePath: formattedPath,
    size: stats.size,
    isDirectory: stats.isDirectory(),
    createdAt: createdAt,
  };
};

const dateFormat = (timestamp) => {
  const date = new Date(timestamp);
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
  const yyyy = date.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const main = async () => {
  const testPath = path.join(__dirname, "tmp1"); // Adjusted to use 'tmp1'
  try {
    const result = await getFileTree(testPath);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err.message);
  }
};

main();
module.exports = getFileTree;
