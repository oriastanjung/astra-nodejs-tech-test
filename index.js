const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');

const extractGzFile = async (filePath, outputDir) => {
    return new Promise((resolve, reject) => {
        const gunzip = zlib.createGunzip();
        const source = fs.createReadStream(filePath);
        const destination = fs.createWriteStream(path.join(outputDir, path.basename(filePath, '.gz')));

        source.pipe(gunzip).pipe(destination)
            .on('finish', resolve)
            .on('error', reject);
    });
};

const getFileTree = async (dirPath) => {
    try {
        console.log(`Resolving path: ${dirPath}`);
        const resolvedPath = path.resolve(dirPath);

        // Check if the path exists before attempting to get stats
        await fs.access(resolvedPath);

        const stats = await fs.stat(resolvedPath);
        console.log(`Stats: ${JSON.stringify(stats)}`);

        if (stats.isFile()) {
            // Jika file .gz, ekstrak terlebih dahulu
            if (resolvedPath.endsWith('.gz')) {
                const outputDir = path.dirname(resolvedPath);
                await extractGzFile(resolvedPath, outputDir);
                // Setelah ekstrak, dapatkan metadata file yang baru
                const extractedFilePath = path.join(outputDir, path.basename(resolvedPath, '.gz'));
                return [await getFileMetadata(extractedFilePath)];
            }
            return [await getFileMetadata(resolvedPath)];
        } else if (stats.isDirectory()) {
            const files = await fs.readdir(resolvedPath);
            console.log(`Files: ${files}`);
            const fileDetailsPromises = files.map(file => 
                getFileTree(path.join(resolvedPath, file)) // Recursively call getFileTree
            );
            const fileDetails = await Promise.all(fileDetailsPromises);
            return fileDetails.flat().sort((a, b) => a.fileName.localeCompare(b.fileName));
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        throw new Error('Invalid Path');
    }
};

const getFileMetadata = async (filePath) => {
    const stats = await fs.stat(filePath);
    const createdAt = stats.birthtime.toISOString().split('T')[0];

    const projectRoot = path.resolve(__dirname);
    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
    const formattedPath = `/${relativePath.replace(/^(..\/)+/, '')}`;

    return {
        fileName: path.basename(filePath),
        filePath: formattedPath,
        size: stats.size,
        createdAt: createdAt,
        isDirectory: stats.isDirectory(),
    };
};

const main = async () => {
    const testPath = path.join(__dirname, 'tmp');
    try {
        const result = await getFileTree(testPath);
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(err.message);
    }
};

main();
module.exports = getFileTree; // Export getFileTree
