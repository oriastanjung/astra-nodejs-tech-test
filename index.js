// Import modul `fs` (filesystem) dari Node.js dan menggunakan versi promise-nya untuk menangani operasi file secara asynchronous.
const fs = require("fs").promises;

// Import modul `path` dari Node.js untuk menangani dan memanipulasi path file dan direktori.
const path = require("path");

// Fungsi asynchronous untuk mendapatkan tree (struktur) dari file atau direktori yang diberikan path-nya.
const getFileTree = async (dirPath) => {
  try {
    // Mengubah `dirPath` menjadi path absolut yang valid.
    const resolvedPath = path.resolve(dirPath);
    
    // Mengecek apakah path tersebut bisa diakses (ada atau tidak).
    await fs.access(resolvedPath);
    
    // Mendapatkan informasi statistik file (apakah file atau folder, ukurannya, dsb.)
    const stats = await fs.stat(resolvedPath);
    
    // Jika path adalah file, dapatkan metadata file tersebut dan return dalam array.
    if (stats.isFile()) {
      return [await getFileMetadata(resolvedPath)];
    
    // Jika path adalah direktori, baca daftar file/direktori di dalamnya.
    } else if (stats.isDirectory()) {
      const files = await fs.readdir(resolvedPath);
      
      // Buat array promise untuk setiap file, di mana metadata setiap file akan diambil.
      const fileDetailsPromises = files.map((file) =>
        getFileMetadata(path.join(resolvedPath, file))
      );

      // Tunggu semua promise selesai dan dapatkan detail setiap file.
      const fileDetails = await Promise.all(fileDetailsPromises);
      
      // Mengurutkan file berdasarkan nama file secara alfabetis.
      return fileDetails.sort((a, b) => a.fileName.localeCompare(b.fileName));
    }
  } catch (error) {
    // Jika ada error, tampilkan pesan error dan lempar error baru dengan pesan "Invalid Path".
    console.error(`Error: ${error.message}`);
    throw new Error("Invalid Path");
  }
};

// Fungsi untuk mendapatkan metadata file, seperti nama, ukuran, path relatif, dsb.
const getFileMetadata = async (filePath) => {
  // Mendapatkan statistik file.
  const stats = await fs.stat(filePath);
  
  // Format tanggal file saat dibuat.
  const createdAt = dateFormat(stats.birthtimeMs);
  
  // Mendapatkan root project dari file yang sedang berjalan.
  const projectRoot = path.resolve(__dirname);
  
  // Menghitung path relatif dari file terhadap root project.
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, "/");
  
  // Menghilangkan ".." dari path relatif untuk memastikan path yang bersih.
  const formattedPath = `/${relativePath.replace(/^(..\/)+/, "")}`;
  
  // Return metadata dari file termasuk nama file, path, ukuran, apakah direktori, dan tanggal pembuatan.
  return {
    fileName: path.basename(filePath), // Nama file.
    filePath: formattedPath, // Path relatif.
    size: stats.size, // Ukuran file dalam byte.
    isDirectory: stats.isDirectory(), // Apakah direktori.
    createdAt: createdAt, // Tanggal pembuatan.
  };
};

// Fungsi untuk memformat timestamp menjadi format tanggal 'dd-mm-yyyy'.
const dateFormat = (timestamp) => {
  // Membuat object Date dari timestamp.
  const date = new Date(timestamp);
  
  // Mengambil tanggal (dd) dan menambahkan angka 0 jika kurang dari 10.
  const dd = String(date.getUTCDate()).padStart(2, '0');
  
  // Mengambil bulan (mm) dan menambahkan angka 0 jika kurang dari 10. Perlu diingat bulan di JavaScript adalah 0-based.
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0'); 
  
  // Mengambil tahun (yyyy).
  const yyyy = date.getUTCFullYear();
  
  // Return string dalam format 'dd-mm-yyyy'.
  return `${dd}-${mm}-${yyyy}`;
};

// Fungsi utama yang dijalankan saat script dipanggil.
const main = async () => {
  // Menggunakan path 'tmp1' relatif terhadap direktori saat ini sebagai contoh.
  const testPath = path.join(__dirname, "tmp1"); 
  
  try {
    // Mendapatkan struktur file dari path dan log hasilnya dalam format JSON.
    const result = await getFileTree(testPath);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    // Menangkap error jika ada dan menampilkannya ke console.
    console.error(err.message);
  }
};

// Memanggil fungsi utama.
main();

// Mengekspor fungsi `getFileTree` agar bisa digunakan di file lain.
module.exports = getFileTree;
