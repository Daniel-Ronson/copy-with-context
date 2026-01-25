# Copy Selected Code with Context - Command Flow

This diagram shows the complete data flow and algorithm for the `copySelectedCodeWithContextCommand` which copies selected code from the active editor.

```mermaid
flowchart TD
    Start([User Right-clicks Selected Code in Editor]) --> GetEditor[Get active text editor]

    GetEditor --> CheckEditor{Editor exists?}
    CheckEditor -->|No| ShowError1[Show error: No active editor]
    CheckEditor -->|Yes| GetSelection[Get current selection]

    ShowError1 --> End([End])

    GetSelection --> CheckEmpty{Selection is empty?}
    CheckEmpty -->|Yes| ShowInfo[Show info: No code selected]
    CheckEmpty -->|No| GetLineNumbers[Calculate line numbers]

    ShowInfo --> End

    GetLineNumbers --> CalcStart[startLine = selection.start.line + 1<br/>1-based indexing]
    CalcStart --> CalcEnd[endLine = selection.end.line + 1<br/>1-based indexing]

    CalcEnd --> GetDocument[Get document from editor]
    GetDocument --> ExtractText[Extract selected text<br/>document.getText selection]

    ExtractText --> GetUri[Get document URI]
    GetUri --> GetWorkspace[Get workspace folders]

    GetWorkspace --> CheckWorkspace{Workspace exists?}
    CheckWorkspace -->|No| UseFullPath[Use full file path]
    CheckWorkspace -->|Yes| CalcRelPath[Calculate relative path<br/>from workspace root]

    UseFullPath --> GetExtension
    CalcRelPath --> GetExtension[Get file extension]

    GetExtension --> GetLanguage[Get markdown language<br/>from extension mapping]
    GetLanguage --> CheckMd{Is .md file?}

    CheckMd -->|Yes| UseSixTicks[Use 6 backticks]
    CheckMd -->|No| UseThreeTicks[Use 3 backticks]

    UseSixTicks --> FormatBlock1["Create markdown block:<br/>#### path lines X-Y<br/>``````lang<br/>selected text<br/>``````"]
    UseThreeTicks --> FormatBlock2["Create markdown block:<br/>#### path lines X-Y<br/>```lang<br/>selected text<br/>```"]

    FormatBlock1 --> CopyClipboard
    FormatBlock2 --> CopyClipboard[Copy to VSCode clipboard]

    CopyClipboard --> ShowSuccess[Show success message in status bar:<br/>'Copied X lines to clipboard']
    ShowSuccess --> End

    style Start fill:#e1f5ff
    style End fill:#e1f5ff
    style CopyClipboard fill:#d4f4dd
    style ShowSuccess fill:#d4f4dd
    style ShowError1 fill:#ffe1e1
    style ShowInfo fill:#fff4e1
```

## Algorithm Steps

### Phase 1: Validation
1. **Get Active Editor**
   - Retrieve the currently active text editor from VSCode
   - If no editor is active → show error and exit
2. **Get Selection**
   - Retrieve the current text selection from the editor
   - If selection is empty (no text selected) → show info message and exit

### Phase 2: Line Number Calculation
1. **Extract Line Numbers**
   - Start line: `selection.start.line + 1` (convert from 0-based to 1-based)
   - End line: `selection.end.line + 1` (convert from 0-based to 1-based)
   - These will be displayed in the header for context

### Phase 3: Text Extraction
1. **Get Selected Text**
   - Use `document.getText(selection)` to extract the selected text
   - Preserves exact formatting, indentation, and newlines

### Phase 4: Path Calculation
1. **Get File Path**
   - Get document URI from editor
   - Check if file is in a workspace
   - **If in workspace**:
     - Calculate relative path from workspace root
     - Example: `src/commands.ts`
   - **If not in workspace**:
     - Use full absolute path
     - Example: `/Users/username/project/file.ts`

### Phase 5: Formatting
1. **Determine Language**
   - Extract file extension (e.g., `.ts`, `.py`, `.js`)
   - Look up markdown language identifier from mapping (100+ extensions supported)
   - Example: `.ts` → `typescript`, `.py` → `python`

2. **Create Markdown Block**
   - Header format: `#### <path> (lines <start>-<end>)`
   - **Normal files**: Use 3 backticks for code fence
   - **Markdown files**: Use 6 backticks to prevent conflicts with nested code blocks
   - Content: Selected text (no modifications)

### Phase 6: Output
1. **Copy to Clipboard**
   - Write formatted markdown to VSCode clipboard
2. **User Notification**
   - Show temporary status bar message: "Copied X lines to clipboard"
   - Message auto-hides after 5 seconds

## Output Format Example

### For TypeScript Code (lines 25-42)

```markdown
#### src/commands.ts (lines 25-42)
```typescript
export async function copySelectionWithContextCommand(
    _contextSelection: vscode.Uri | undefined,
    allSelections: vscode.Uri[] | undefined,
    statusBarItem: vscode.StatusBarItem
): Promise<void> {
    if (!allSelections || allSelections.length === 0) {
        vscode.window.showErrorMessage('No files selected');
        return;
    }
    // ... rest of the code
}
```
```

### For Markdown Code (lines 10-15)

```markdown
#### README.md (lines 10-15)
``````markdown
## Features

- Copy files with context
- Copy code with line numbers
- Exclude unwanted files
``````
```

## Key Features

### Context Preservation
- **Line numbers**: Shows exactly which lines were selected
- **File path**: Shows where the code came from
- **Relative paths**: Uses workspace-relative paths when possible for portability

### Markdown Compatibility
- **Syntax highlighting**: Automatically detects language from file extension
- **Nested code blocks**: Uses 6 backticks for markdown files to avoid conflicts
- **Exact formatting**: Preserves all indentation, spacing, and newlines

### User Experience
- **Instant feedback**: Status bar message shows immediately
- **Line count**: Shows how many lines were copied
- **Auto-hide**: Message disappears after 5 seconds
- **Error handling**: Clear messages for missing editor or empty selection

## Use Cases

This command is perfect for:
- Sharing code snippets in GitHub issues or PRs
- Creating documentation with code examples
- Asking LLM questions with specific code context
- Code reviews with precise line references
- Creating tutorials with numbered code sections
