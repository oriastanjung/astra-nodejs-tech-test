const fs = require('fs').promises;
const path = require('path');

const getFileTree = async (dirPath) => {
    try {
        console.log(`Resolving path: ${dirPath}`);
        const resolvedPath = path.resolve(dirPath);

        // Check if the path exists before attempting to get stats
        await fs.access(resolvedPath);

        const stats = await fs.stat(resolvedPath);
        console.log(`Stats: ${JSON.stringify(stats)}`);

        if (stats.isFile()) {
            return [await getFileMetadata(resolvedPath)];
        } else if (stats.isDirectory()) {
            const files = await fs.readdir(resolvedPath);
            console.log(`Files: ${files}`);
            const fileDetailsPromises = files.map(file => 
                getFileMetadata(path.join(resolvedPath, file))
            );
            const fileDetails = await Promise.all(fileDetailsPromises);
            return fileDetails.sort((a, b) => a.fileName.localeCompare(b.fileName));
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
        isDirectory: stats.isDirectory(), // Correct usage for checking if it's a directory
    };
};

const main = async () => {
    const testPath = path.join(__dirname, 'tmp', 'test_dir');
    try {
        const result = await getFileTree(testPath);
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(err.message);
    }
};

main()
module.exports = getFileTree; // Change this to export getFileTree instead of main
