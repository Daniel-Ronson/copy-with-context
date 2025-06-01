# Context Copy for VS Code

<!-- Optional: Add other badges like build status or license if applicable -->

Bulk Copy the content of multiple files and folders from the VS Code Explorer onto your clipboard, formatted in markdown. Perfect to use as context for ChatGPT, Gemini, Claude, or Ai Studio.

**Copy multiple files in a way that llms can easily understand by appending filenames, and having clear file boundaries. Formatted in markdown with filenames as headers.**

## Copy Files and Folders
![Context Copy Demo](https://raw.githubusercontent.com/Daniel-Ronson/copy-with-context/main/public/gifs/copy-demo.gif)
*   **LLM-Friendly Formatting:** Output includes clear delimiters with relative paths:
    ````text
    #### src/fileUtils.ts
    ```typescript
    // Content of fileUtils.ts
    ```
    #### src/package.json
    ```json
    // Content of package.json
    ```
    ````
## Features
*   **Multi-Select Support:** Select any combination of files and folders
*   **Customizable exclusions:** Configure which files and folders to exclude
*   **Smart Filtering:**
    *   **Skips** .env | binary files | images/videos | archives
    *   **Skips excessively large files** (files > 5MB not copied)
*   **Recursive Folder Copy:** Copies all valid files within selected folders and subdirectories

## Usage
1.  Select one or more files/folders in vscode menu explorer
2.  Right-click on your selection
3.  Choose "**Context Copy: llm friendly formatting**" from the menu
4.  A brief success message will appear in the Status Bar (bottom left)
5.  Paste the content into your LLM prompt, text file, or anywhere else!
6.  images, videos, and binary files are skipped

### Configuration
You can customize which files and folders are excluded from copying:

1. Open the command palette (Ctrl+Shift+P / Cmd+Shift+P)
![Context Copy Demo](https://raw.githubusercontent.com/Daniel-Ronson/copy-with-context/main/public/gifs/quickpick-final.gif)
2. Search for "Copy Context: Edit Excluded Paths"
3. Use the dialog to manage exclusions:
   - **Enable/disable existing exclusions**: Click the toggle button to mark paths for removal
   - **Add new exclusions**: Select "Add new exclusion..." and enter a path
   - **Reset to defaults**: Select "Reset to defaults" to restore the original exclusion list
   - **Finalize your changes**: Press Escape to close the dialog and apply all changes at once

All changes (including reset to defaults) are staged until you close the dialog, allowing you to experiment with different configurations before committing. Default exclusions are clearly marked to help you identify custom vs. built-in settings.

By default, the following paths are excluded:
```
.git
node_modules
out
dist
.env
.vercel
.next
.vscode-test
```

## Known Issues
*   Currently, no known issues. Please report any bugs!

## Future Roadmap
 - Ignore everything in the .gitignore

## Contributing

Contributions, issues, and feature requests are welcome! Please open an issue or submit a pull request on Github: [project repository](https://github.com/Daniel-Ronson/copy-with-context.git) <!-- Replace with your actual repo URL -->.


[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/copy-context.copy-with-context?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=copy-context.copy-with-context&ssr=false#overview)