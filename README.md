# Context Copy for VS Code

<!-- Optional: Add other badges like build status or license if applicable -->

Effortlessly copy the content of multiple files and entire folders from the VS Code Explorer to your clipboard, perfectly formatted with relative paths for use with Large Language Models (LLMs) like ChatGPT, Claude, Bard, etc.

**Tired of manually copying and pasting files one by one into your AI prompts? Context Copy streamlines this process!**

## Features

*   **Context Menu Integration:** Right-click on files or folders in the VS Code Explorer.
*   **Multi-Select Support:** Select any combination of files and folders.
*   **Recursive Folder Processing:** Copies content from all valid text files within selected folders and their subdirectories (up to a configurable depth).
*   **LLM-Friendly Formatting:** Output includes clear delimiters with relative paths:
    ````text
    ```[src/utils/fileUtils.ts]
    // Content of fileUtils.ts...
    ```
    
    ```[src/command.ts]
    // Content of command.ts
    ```
    ````
*   **Smart Filtering:**
    *   Automatically **skips binary files** (images, archives, executables, etc.).
    *   Automatically **skips excessively large files** (default > 5MB, configurable in code).
    *   Handles read errors gracefully.
*   **Avoid sensitive files:** Sensitive files such as .env are never copied to clipboard.

## Demo

**(Strongly Recommended!)** Add a short animated GIF here showing the right-click action and the resulting format on the clipboard (e.g., pasted into a text editor).

<!-- ![Context Copy Demo](path/to/your/demo.gif) Replace with actual path or URL -->

## Usage

1.  In the VS Code Explorer panel, select one or more files and/or folders.
2.  Right-click on your selection.
3.  Choose "**Context Copy: Copy Selection with Context**" from the menu.
4.  A brief success message will appear in the Status Bar (bottom left).
5.  Paste the content into your LLM prompt, text file, or anywhere else!
6.  If any files were skipped (e.g., too large, binary), a warning notification pop-up will provide details.

## Configuration

Currently, the following settings are managed via constants within the source code (primarily in `src/utils/constants.ts` and `src/commands/copyContextCommand.ts`):

*   **`MAX_FILE_SIZE_BYTES`**: Maximum size for included files (default: 5MB).
*   **`BINARY_FILE_EXTENSIONS`**: Set of extensions considered binary.
*   **`MAX_RECURSION_DEPTH`**: Maximum depth to search within folders (default: 10).
*   **`STATUS_BAR_MESSAGE_DURATION_MS`**: How long the success message stays in the status bar (default: 5000ms).

*Future versions may expose these via standard VS Code settings.*

## Known Issues

*   Currently, no known issues. Please report any bugs!

## Release Notes

See the [CHANGELOG.md](CHANGELOG.md) file for details on changes in each version.

## Contributing

Contributions, issues, and feature requests are welcome! Please feel free to open an issue or submit a pull request on the [project repository](https://github.com/YOUR_USERNAME/YOUR_REPO) <!-- Replace with your actual repo URL -->.

## License

[MIT]