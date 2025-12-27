import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { copySelectionWithContextCommand } from '../commands';

/**
 * Comprehensive test suite for copySelectionWithContextCommand
 * These tests verify the current behavior before refactoring the exclusion logic
 */
suite('Copy Selection with Context - Exclusion Tests', () => {
    let testWorkspaceUri: vscode.Uri;
    let statusBarItem: vscode.StatusBarItem;
    let originalConfig: vscode.WorkspaceConfiguration;

    // Helper to create a test file
    async function createTestFile(relativePath: string, content: string): Promise<vscode.Uri> {
        const fileUri = vscode.Uri.joinPath(testWorkspaceUri, relativePath);
        const dirPath = path.dirname(fileUri.fsPath);

        // Ensure directory exists
        await fs.mkdir(dirPath, { recursive: true });

        // Write file
        await fs.writeFile(fileUri.fsPath, content, 'utf8');

        return fileUri;
    }

    // Helper to create a directory
    async function createTestDir(relativePath: string): Promise<vscode.Uri> {
        const dirUri = vscode.Uri.joinPath(testWorkspaceUri, relativePath);
        await fs.mkdir(dirUri.fsPath, { recursive: true });
        return dirUri;
    }

    // Helper to cleanup test files
    async function cleanupTestFiles() {
        if (testWorkspaceUri) {
            try {
                const testDir = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp');
                await fs.rm(testDir.fsPath, { recursive: true, force: true });
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }

    suiteSetup(async () => {
        // Get workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found for testing');
        }
        testWorkspaceUri = workspaceFolders[0].uri;

        // Create status bar item for tests
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

        // Save original config
        originalConfig = vscode.workspace.getConfiguration('copyWithContext');
    });

    setup(async () => {
        // Reset config to defaults before each test
        await vscode.workspace.getConfiguration('copyWithContext').update(
            'excludedPaths',
            ['.git', 'node_modules', 'out', 'dist', '.env', '.vercel', '.next', '.vscode-test'],
            vscode.ConfigurationTarget.Global
        );

        // Clean up from previous tests
        await cleanupTestFiles();
    });

    teardown(async () => {
        // Cleanup after each test
        await cleanupTestFiles();
    });

    suiteTeardown(() => {
        // Dispose status bar item
        if (statusBarItem) {
            statusBarItem.dispose();
        }
    });

    test('Test 1: Copy single non-excluded file', async () => {
        // Create a simple test file
        const fileUri = await createTestFile('test-temp/sample.txt', 'Hello World');

        // Execute command
        await copySelectionWithContextCommand(undefined, [fileUri], statusBarItem);

        // Read clipboard
        const clipboardContent = await vscode.env.clipboard.readText();

        // Verify content is copied
        assert.ok(clipboardContent.includes('sample.txt'), 'File path should be in clipboard');
        assert.ok(clipboardContent.includes('Hello World'), 'File content should be in clipboard');
    });

    test('Test 2: Exclude node_modules when directly selected', async () => {
        // Create node_modules directory with files
        await createTestDir('test-temp/node_modules');
        await createTestFile('test-temp/node_modules/package.json', '{"name": "test"}');
        await createTestFile('test-temp/regular.txt', 'Regular file');

        const nodeModulesUri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/node_modules');
        const regularUri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/regular.txt');

        // Execute command selecting both node_modules and regular file
        await copySelectionWithContextCommand(undefined, [nodeModulesUri, regularUri], statusBarItem);

        // Read clipboard
        const clipboardContent = await vscode.env.clipboard.readText();

        // Verify node_modules is excluded
        assert.ok(!clipboardContent.includes('package.json'), 'node_modules files should be excluded');
        assert.ok(clipboardContent.includes('Regular file'), 'Regular file should be included');
    });

    test('Test 3: Exclude node_modules when parent folder selected', async () => {
        // Create parent directory with node_modules and regular files
        await createTestDir('test-temp/project');
        await createTestDir('test-temp/project/node_modules');
        await createTestFile('test-temp/project/node_modules/lib.js', 'module.exports = {}');
        await createTestFile('test-temp/project/index.js', 'const lib = require("./node_modules/lib")');

        const projectUri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/project');

        // Execute command selecting parent folder
        await copySelectionWithContextCommand(undefined, [projectUri], statusBarItem);

        // Read clipboard
        const clipboardContent = await vscode.env.clipboard.readText();

        // Verify node_modules is excluded but index.js is included
        assert.ok(!clipboardContent.includes('lib.js'), 'node_modules files should be excluded');
        assert.ok(!clipboardContent.includes('module.exports'), 'node_modules content should be excluded');
        assert.ok(clipboardContent.includes('index.js'), 'Regular files should be included');
        assert.ok(clipboardContent.includes('require'), 'Regular file content should be included');
    });

    test('Test 4: Exclude multiple default exclusions', async () => {
        // Create files matching multiple exclusions
        await createTestDir('test-temp/project');
        await createTestFile('test-temp/project/.env', 'SECRET_KEY=12345');
        await createTestFile('test-temp/project/.git/config', '[core]');
        await createTestDir('test-temp/project/dist');
        await createTestFile('test-temp/project/dist/bundle.js', 'bundled code');
        await createTestFile('test-temp/project/source.ts', 'source code');

        const projectUri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/project');

        // Execute command
        await copySelectionWithContextCommand(undefined, [projectUri], statusBarItem);

        // Read clipboard
        const clipboardContent = await vscode.env.clipboard.readText();

        // Verify all exclusions work
        assert.ok(!clipboardContent.includes('SECRET_KEY'), '.env should be excluded');
        assert.ok(!clipboardContent.includes('[core]'), '.git should be excluded');
        assert.ok(!clipboardContent.includes('bundled code'), 'dist should be excluded');
        assert.ok(clipboardContent.includes('source code'), 'Regular files should be included');
    });

    test('Test 5: Exclude file with excluded filename', async () => {
        // Create .env file directly
        await createTestFile('test-temp/.env', 'SECRET=value');
        await createTestFile('test-temp/config.js', 'module.exports = {}');

        const envUri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/.env');
        const configUri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/config.js');

        // Execute command selecting both files
        await copySelectionWithContextCommand(undefined, [envUri, configUri], statusBarItem);

        // Read clipboard
        const clipboardContent = await vscode.env.clipboard.readText();

        // Verify .env is excluded
        assert.ok(!clipboardContent.includes('SECRET'), '.env file should be excluded');
        assert.ok(clipboardContent.includes('module.exports'), 'Regular file should be included');
    });

    test('Test 6: Mix of excluded and non-excluded files in same directory', async () => {
        // Create mix of files
        await createTestDir('test-temp/mixed');
        await createTestFile('test-temp/mixed/app.js', 'app code');
        await createTestFile('test-temp/mixed/.env', 'env vars');
        await createTestFile('test-temp/mixed/test.js', 'test code');
        await createTestFile('test-temp/mixed/.gitignore', 'node_modules');

        const mixedUri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/mixed');

        // Execute command
        await copySelectionWithContextCommand(undefined, [mixedUri], statusBarItem);

        // Read clipboard
        const clipboardContent = await vscode.env.clipboard.readText();

        // Verify correct filtering
        assert.ok(clipboardContent.includes('app code'), 'app.js should be included');
        assert.ok(clipboardContent.includes('test code'), 'test.js should be included');
        assert.ok(!clipboardContent.includes('env vars'), '.env should be excluded');
        // Note: .gitignore is not in default exclusions, so it should be included
        assert.ok(clipboardContent.includes('node_modules'), '.gitignore should be included');
    });

    test('Test 7: Custom exclusion configuration', async () => {
        // Update config with custom exclusions
        await vscode.workspace.getConfiguration('copyWithContext').update(
            'excludedPaths',
            ['vendor', 'build'],
            vscode.ConfigurationTarget.Global
        );

        // Wait a bit for config to update
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create files
        await createTestDir('test-temp/project');
        await createTestFile('test-temp/project/vendor/lib.php', 'php lib');
        await createTestFile('test-temp/project/build/output.js', 'built file');
        await createTestFile('test-temp/project/src/main.php', 'source');

        const projectUri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/project');

        // Execute command
        await copySelectionWithContextCommand(undefined, [projectUri], statusBarItem);

        // Read clipboard
        const clipboardContent = await vscode.env.clipboard.readText();

        // Verify custom exclusions work
        assert.ok(!clipboardContent.includes('php lib'), 'vendor should be excluded');
        assert.ok(!clipboardContent.includes('built file'), 'build should be excluded');
        assert.ok(clipboardContent.includes('source'), 'src files should be included');
    });

    test('Test 8: Empty selection should show error', async () => {
        // Execute with empty selection
        await copySelectionWithContextCommand(undefined, [], statusBarItem);

        // Verify status bar shows error (we can't easily assert the message, but ensure no crash)
        // The command should handle this gracefully
        assert.ok(true, 'Command should handle empty selection without crashing');
    });

    test('Test 9: Binary files excluded along with path exclusions', async () => {
        // Create mix of binary and text files, some in excluded paths
        await createTestDir('test-temp/assets');
        await createTestFile('test-temp/assets/image.png', 'fake png binary data');
        await createTestFile('test-temp/assets/style.css', 'body { margin: 0; }');
        await createTestDir('test-temp/node_modules');
        await createTestFile('test-temp/node_modules/lib.js', 'library');

        const assetsUri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/assets');
        const nodeModulesUri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/node_modules');

        // Execute command
        await copySelectionWithContextCommand(undefined, [assetsUri, nodeModulesUri], statusBarItem);

        // Read clipboard
        const clipboardContent = await vscode.env.clipboard.readText();

        // Verify both binary and path exclusions work
        assert.ok(!clipboardContent.includes('fake png'), 'Binary files should be excluded');
        assert.ok(!clipboardContent.includes('library'), 'node_modules should be excluded');
        assert.ok(clipboardContent.includes('margin'), 'CSS file should be included');
    });

    test('Test 10: Nested excluded directories', async () => {
        // Create nested structure with multiple levels of exclusions
        await createTestDir('test-temp/project');
        await createTestFile('test-temp/project/app.js', 'app');
        await createTestDir('test-temp/project/node_modules/package');
        await createTestFile('test-temp/project/node_modules/package/index.js', 'nested lib');
        await createTestDir('test-temp/project/node_modules/.bin');
        await createTestFile('test-temp/project/node_modules/.bin/exec', 'binary');

        const projectUri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/project');

        // Execute command
        await copySelectionWithContextCommand(undefined, [projectUri], statusBarItem);

        // Read clipboard
        const clipboardContent = await vscode.env.clipboard.readText();

        // Verify all nested exclusions work
        assert.ok(!clipboardContent.includes('nested lib'), 'Nested node_modules files should be excluded');
        assert.ok(!clipboardContent.includes('binary'), 'Nested .bin should be excluded');
        assert.ok(clipboardContent.includes('app'), 'Root files should be included');
    });

    test('Test 11: Exclusion consistency during multiple async operations', async () => {
        // Create multiple directories to trigger multiple async findFiles operations
        await createTestDir('test-temp/dir1');
        await createTestDir('test-temp/dir2');
        await createTestDir('test-temp/dir3');

        await createTestFile('test-temp/dir1/file1.js', 'content1');
        await createTestDir('test-temp/dir1/node_modules');
        await createTestFile('test-temp/dir1/node_modules/lib1.js', 'excluded1');

        await createTestFile('test-temp/dir2/file2.js', 'content2');
        await createTestDir('test-temp/dir2/node_modules');
        await createTestFile('test-temp/dir2/node_modules/lib2.js', 'excluded2');

        await createTestFile('test-temp/dir3/file3.js', 'content3');
        await createTestDir('test-temp/dir3/node_modules');
        await createTestFile('test-temp/dir3/node_modules/lib3.js', 'excluded3');

        const dir1Uri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/dir1');
        const dir2Uri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/dir2');
        const dir3Uri = vscode.Uri.joinPath(testWorkspaceUri, 'test-temp/dir3');

        // Execute command with multiple directories (triggers parallel async operations)
        await copySelectionWithContextCommand(undefined, [dir1Uri, dir2Uri, dir3Uri], statusBarItem);

        // Read clipboard
        const clipboardContent = await vscode.env.clipboard.readText();

        // Verify exclusions work consistently across all parallel operations
        assert.ok(clipboardContent.includes('content1'), 'dir1 files should be included');
        assert.ok(clipboardContent.includes('content2'), 'dir2 files should be included');
        assert.ok(clipboardContent.includes('content3'), 'dir3 files should be included');
        assert.ok(!clipboardContent.includes('excluded1'), 'dir1 node_modules should be excluded');
        assert.ok(!clipboardContent.includes('excluded2'), 'dir2 node_modules should be excluded');
        assert.ok(!clipboardContent.includes('excluded3'), 'dir3 node_modules should be excluded');
    });
});
