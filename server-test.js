// Simple test script to verify directory creation
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

const __dirname = process.cwd();
console.log(`Working directory: ${__dirname}`);

async function testDirectoryCreation() {
  console.log("Running directory creation test...");

  // Create game assets directory
  const GAMES_DIR = path.join(__dirname, 'public', 'assets', 'games');
  console.log(`Games directory path: ${GAMES_DIR}`);

  // Create test game directory
  const testGameId = `test-game-${Date.now()}`;
  const testGameDir = path.join(GAMES_DIR, testGameId);
  console.log(`Test game directory path: ${testGameDir}`);

  try {
    // First ensure the games directory exists
    if (!fs.existsSync(GAMES_DIR)) {
      console.log(`Creating games directory: ${GAMES_DIR}`);
      await fsPromises.mkdir(GAMES_DIR, { recursive: true });
      console.log(`Games directory created: ${GAMES_DIR}`);
    } else {
      console.log(`Games directory already exists: ${GAMES_DIR}`);
    }

    // List contents of games directory
    const gamesContents = await fsPromises.readdir(GAMES_DIR);
    console.log(`Games directory contents: ${gamesContents.join(', ')}`);

    // Create the test game directory
    console.log(`Creating test game directory: ${testGameDir}`);
    await fsPromises.mkdir(testGameDir, { recursive: true });
    console.log(`Test game directory created: ${testGameDir}`);

    // Verify the test game directory was created
    if (fs.existsSync(testGameDir)) {
      console.log(`Test game directory verified: ${testGameDir}`);
    } else {
      console.error(`❌ Test game directory was not created properly: ${testGameDir}`);
    }

    // Create test subdirectories (symbols, background, frame, config)
    const testDirs = ['symbols', 'background', 'frame', 'config'];
    for (const dir of testDirs) {
      const subDir = path.join(testGameDir, dir);
      console.log(`Creating ${dir} directory: ${subDir}`);
      await fsPromises.mkdir(subDir, { recursive: true });

      // Verify subdirectory was created
      if (fs.existsSync(subDir)) {
        console.log(`${dir} directory created: ${subDir}`);
      } else {
        console.error(`❌ ${dir} directory was not created properly: ${subDir}`);
      }
    }

    // List contents of test game directory
    const contents = await fsPromises.readdir(testGameDir);
    console.log(`Test game directory contents: ${contents.join(', ')}`);

    // Write a test file
    const testFilePath = path.join(testGameDir, 'test.txt');
    console.log(`Writing test file: ${testFilePath}`);
    await fsPromises.writeFile(testFilePath, 'This is a test file to verify write permissions.');

    // Verify the test file was created
    if (fs.existsSync(testFilePath)) {
      console.log(`✅ Test file created successfully: ${testFilePath}`);
    } else {
      console.error(`❌ Test file was not created properly: ${testFilePath}`);
    }

    console.log("Directory creation test completed successfully!");
  } catch (error) {
    console.error(`❌ Error during directory creation test: ${error.message}`);
    console.error(error);
  }
}

// Run the test
testDirectoryCreation().then(() => {
  console.log("Test completed.");
}).catch(err => {
  console.error("Test failed with error:", err);
});