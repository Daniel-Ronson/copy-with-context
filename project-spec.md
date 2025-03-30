Hello, i am a senior software engineer with an idea for an app, and you are a senior software engineer who will help me build an application. The app is a vscode extension. I have alreayd initialized the project using code yo and eslint as a builder.

Below is a Project Specification for the vscode extension "Context Copy" . You will read and undertand the project specification. Outline the file structure we need using DRY coding principles. and implement every file and piece of code. your output should be the directory structure with filenames, and every code file clearly marked with filenames. we are using typescript.


Project Specification for software development of the vscode extension "Context Copy" 

---

## Project Specification (Revised)

### user goals 
Users want to be able to easily copy one or many files at once onto their cliboard. The text saved onto the cliboard will be in a format that will be easily understood by llms.

### 1. **Project Overview**

We need a VS Code extension that enables users to select multiple text-based files (in the VS Code Explorer panel), right-click, and choose:

-   **"Copy All with Context"** if multiple files are selected
-   **"Copy with Context"** if only one file is selected

When triggered, the extension should gather the selected files’ contents and copy them to the clipboard in a specified format, clearly denoting each file name (relative path) and its file content.

### 2. **Scope & Features**

1.  **Explorer Context Menu Command**
    *   **Names:** "Copy All with Context" (for multiple files) or "Copy with Context" (for a single file).
    *   **Trigger:** Appears in the right-click menu on files/folders in VS Code’s Explorer view.
    *   **Multi-File Selection:** Supports copying content from multiple files at once.

2.  **File Content Aggregation**
    *   **Reading Files:** Read the contents of each selected file (assuming UTF-8 text).
    *   **Formatting Output:** For each file, produce a code-fence snippet showing the file path (relative to the workspace) followed by the file’s contents. The format for each file block is:
    -------
        ```[<relative/path/to/file1.java>]
        <file1.java-contents>
        ```
        ```[<relative/path/to/file2.txt>]
        <file2.txt-content>
        ```
    ---------------------

        (Note: The backticks shown here represent the literal backticks needed in the output. The format starts with ``` followed immediately by the relative path, a newline, the file content, another newline, and the closing ```.)
    *   **DRY Implementation:** The code generating this format should be structured (e.g., using a template function) so the code fence style (` ``` `) or path prefix can be easily modified later if needed.
    *   **Joining Final Output:** All selected files' formatted blocks are concatenated into one large string. with clear separation between files as shown in the example
    *   **Copy to Clipboard:** Immediately place the aggregated, formatted string into the system clipboard using `vscode.env.clipboard.writeText()`.
    *   **Handling Non-Text / Large Files:**
        *   Files identified as likely binary (based on common extensions like `.png`, `.jpg`, `.jpeg`, `.gif`, `.pdf`, `.zip`, `.exe`, `.dll`, `.woff`, `.woff2`, `.o`, `.a`, `.so`, etc.) will be **skipped**.
        *   Files exceeding a defined size threshold (e.g., **5MB**) will also be **skipped**. This threshold should be easily configurable within the code.
        *   Skipped files will be noted, and a single summary warning message will be shown *after* the operation completes (see Error Handling).
    *   **Additional Metadata**: Only the relative file path and raw text content are required. No other metadata (like modification dates) is needed for this version.

### 3. **Functional Requirements**

1.  **Context Menu Registration**
    *   Register a VS Code command in `package.json` under `"contributes.menus.explorer/context"`.
    *   The menu item should be visible (`when` clause) only when the selection in the explorer contains at least one file (`explorerResourceIsFolder` check might be useful here to differentiate, or simply check URIs). Use appropriate labels for single vs. multiple selections if desired, or use one label like "Copy Selection with Context".

2.  **Command Implementation**
    1.  Retrieve the list of selected resource **URIs** from the command arguments.
    2.  Copy contents of all files within folders selected. If some files + same folder is selected, then select all the files in that folders with no duplicates.
    3.  Initialize empty lists/arrays for successful content blocks and skipped file paths.
    4.  For each file URI:
        *   Compute the **relative path** using `vscode.workspace.asRelativePath()`.
        *   Check if the file extension suggests it's binary (using the list from 2.2). If so, add its path to the skipped list and continue to the next file.
        *   Check the file size using `vscode.workspace.fs.stat()`. If it exceeds the threshold (e.g., 5MB), add its path to the skipped list and continue.
        *   Attempt to read the file content using `vscode.workspace.fs.readFile()` (returns `Uint8Array`, decode as UTF-8).
        *   If reading fails (e.g., permissions, file deleted after selection), add its path to the skipped list and continue.
        *   If successful, format the content block as specified in 2.2 (including fences and path). Add this block to the list of successful content.
    5.  Concatenate all successful content blocks, separated by double newlines (`\n\n`).
    6.  Copy the final string to the clipboard.
    7.  If the skipped list is not empty, display a single warning message summarizing which files were skipped (see Error Handling).

3.  **Error Handling & Notifications**
    *   **Skipped Files:** After processing all selected items, if any files were skipped (due to being a directory, binary type, excessive size, or read errors), display a *single* non-modal warning message using `vscode.window.showWarningMessage`. Example: `"Context Copy: Copied content of X files. Skipped Y files (e.g., large/binary/errors): [list first few skipped paths]..."`.
    *   **Success Notification (Optional but Recommended):** Consider showing a brief, subtle confirmation message (e.g., `vscode.window.showInformationMessage` with a short timeout, or a status bar message) indicating success and the number of files copied, like: `"Context Copy: Copied content of Z files to clipboard."`. This provides positive feedback.
    *   **No Files Selected/Valid:** If the selection contains only directories or files that are all skipped, ensure the clipboard isn't modified, and perhaps show an info message like "Context Copy: No valid text files found in selection to copy."

4.  **Testing Requirements**
    *   Verify copying works correctly with single and multiple file selections.
    *   Test with files containing special characters in their paths (spaces, hyphens, non-ASCII chars).
    *   Confirm the final string in the clipboard matches the specified format exactly (fences, path, content, separators).
    *   Test with **empty files** (should be included with header/fences but empty content).
    *   Test with files located **deep within subdirectories**.
    *   Test with files located directly **at the workspace root**.
    *   Test skipping of designated **binary file types** and **large files**.
    *   Test behavior when **directories are included** in the selection (should be ignored).
    *   Test error handling for **non-existent/unreadable files** (ensure they are skipped and reported).
    *   (Optional) Verify basic functionality in a **multi-root workspace** scenario.

### 4. **Technical Stack & Dependencies**

1.  **VS Code Extension API (`vscode` module)**
    *   `vscode.commands.registerCommand`
    *   `vscode.window.showWarningMessage`, `vscode.window.showInformationMessage`
    *   `vscode.env.clipboard.writeText`
    *   `vscode.workspace.asRelativePath`
    *   `vscode.workspace.fs` (for `stat` and `readFile`)
    *   `vscode.Uri`
2.  **Node.js Built-ins**
    *   `path` (potentially useful for extension checking)
    *   `TextDecoder` (for converting `Uint8Array` from `readFile` to string)
3.  **Potential Dependencies:** None anticipated beyond the standard VS Code API and Node built-ins.

### 5. **Project Timeline & Milestones**

*(Same as original, remains appropriate)*
1.  Milestone 1: Scaffold the Extension
2.  Milestone 2: Implement Core Functionality
3.  Milestone 3: Testing & QA (incorporate revised tests from 3.4)
4.  Milestone 4: Documentation & Polishing

### 6. **Deliverables**

*(Same as original, remains appropriate)*
1.  Extension Source Code (TypeScript recommended)
2.  README.md
3.  (Optional) Marketplace Listing

### 7. **Success Criteria**

*   **Functional**: Users can select multiple text/code files (and directories, which are ignored), invoke the command, and get the correctly formatted content of valid text files (within size limits) copied to the clipboard. Skipped files are reported non-intrusively.
*   **Performance**: Handles typical selections (e.g., <50 files, <5MB each) quickly without freezing the UI. File reads are asynchronous.
*   **User Experience**: Command is discoverable. Output format is correct and usable. Feedback (success/warnings) is clear and appropriate.
*   **Robustness**: Handles edge cases like empty files, special paths, non-readable files, large/binary files, and directories gracefully.

---

### Coding Guidelines

*(Same as original, remains appropriate)*
-   Use `yo code` (TypeScript template).
-   Use TypeScript.
-   Separate concerns (commands, utilities, etc.).
-   Follow VS Code API best practices (activation events, disposables, async operations).

--- End of Project Specification ---

