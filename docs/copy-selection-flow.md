# Copy Selection with Context - Command Flow

This diagram shows the complete data flow and algorithm for the `copySelectionWithContextCommand` which copies files/folders from the VSCode Explorer.

```mermaid
flowchart TD
    Start([User Right-clicks Files/Folders in Explorer]) --> CheckSelection{Selection exists?}

    CheckSelection -->|No| ShowError[Show error message]
    CheckSelection -->|Yes| GetUnique[getUniqueFileUrisFromSelection]
    ShowError --> End([End])

    GetUnique --> InitMap[Initialize uniqueFileUrisMap]
    InitMap --> LoopSelections{For each selected URI}

    LoopSelections --> GetFilename[Extract filename from path]
    GetFilename --> CheckExcludedName{Filename in<br/>excluded list?}

    CheckExcludedName -->|Yes| SkipFile1[Skip this file]
    CheckExcludedName -->|No| CheckIsDir{Is directory?}

    CheckIsDir -->|No| AddToMap[Add to uniqueFileUrisMap]
    CheckIsDir -->|Yes| FindFiles[findFiles in directory<br/>with exclusion patterns]

    FindFiles --> AddFoundFiles[Add found files to map]
    AddFoundFiles --> MoreSelections1{More selections?}
    AddToMap --> MoreSelections1
    SkipFile1 --> MoreSelections1

    MoreSelections1 -->|Yes| LoopSelections
    MoreSelections1 -->|No| ConvertToArray[Convert map values to array]

    ConvertToArray --> ProcessAll[Process all unique URIs in parallel<br/>Promise.all]
    ProcessAll --> LoopProcess{For each URI}

    LoopProcess --> ProcessUri[processUri]
    ProcessUri --> GetStats[Get file stats]

    GetStats --> CheckDir2{Is directory?}
    CheckDir2 -->|Yes| ReturnSkip1[Return: skipped - directory]
    CheckDir2 -->|No| ExtractName2[Extract filename]

    ExtractName2 --> CheckExcluded2{Filename in<br/>excluded list?}
    CheckExcluded2 -->|Yes| ReturnSkip2[Return: skipped - excluded]
    CheckExcluded2 -->|No| CheckBinary{Is binary file?<br/>Check extension}

    CheckBinary -->|Yes| ReturnSkip3[Return: skipped - binary]
    CheckBinary -->|No| CheckSize{File size > 5MB?}

    CheckSize -->|Yes| ReturnSkip4[Return: skipped - too large]
    CheckSize -->|No| ReadContent[Read file content as UTF-8]

    ReadContent --> ReturnSuccess[Return: ProcessedFile object<br/>with content]

    ReturnSkip1 --> CollectResults
    ReturnSkip2 --> CollectResults
    ReturnSkip3 --> CollectResults
    ReturnSkip4 --> CollectResults
    ReturnSuccess --> CollectResults[Collect all results]

    CollectResults --> Separate[Separate successful vs skipped files]
    Separate --> CheckSuccess{Any successful<br/>files?}

    CheckSuccess -->|No| ShowNoFiles[Show "no files copied" message]
    CheckSuccess -->|Yes| FormatFiles[Format each successful file]
    ShowNoFiles --> End

    FormatFiles --> LoopFormat{For each file}
    LoopFormat --> GetRelPath[Get workspace-relative path]
    GetRelPath --> GetLang[Get markdown language from extension]
    GetLang --> TrimContent[Trim trailing newlines]
    TrimContent --> CheckMd{Is .md file?}

    CheckMd -->|Yes| UseSixTicks[Use 6 backticks for code fence]
    CheckMd -->|No| UseThreeTicks[Use 3 backticks for code fence]

    UseSixTicks --> CreateBlock1["Create block:<br/>#### path<br/>``````lang<br/>content<br/>``````"]
    UseThreeTicks --> CreateBlock2["Create block:<br/>#### path<br/>```lang<br/>content<br/>```"]

    CreateBlock1 --> MoreFiles{More files?}
    CreateBlock2 --> MoreFiles

    MoreFiles -->|Yes| LoopFormat
    MoreFiles -->|No| JoinBlocks[Join all blocks with \n\n]

    JoinBlocks --> CopyClipboard[Copy to VSCode clipboard]
    CopyClipboard --> CountSuccess[Count successful files]
    CountSuccess --> ShowSuccess[Show success message in status bar]
    ShowSuccess --> CheckSkipped{Any files<br/>skipped?}

    CheckSkipped -->|Yes| CountReasons[Count skip reasons:<br/>- Binary files<br/>- Large files<br/>- Excluded files<br/>- Directories]
    CheckSkipped -->|No| End

    CountReasons --> BuildWarning[Build warning message with counts]
    BuildWarning --> ShowWarning[Show warning notification]
    ShowWarning --> End

    style Start fill:#e1f5ff
    style End fill:#e1f5ff
    style CopyClipboard fill:#d4f4dd
    style ShowSuccess fill:#d4f4dd
    style ShowError fill:#ffe1e1
    style ShowWarning fill:#fff4e1
```

## Algorithm Steps

### Phase 1: Collection and Deduplication
1. **Input**: Array of selected URIs from VSCode Explorer
2. **Process**:
   - Create a Map to ensure unique files (prevents duplicates)
   - For each selected URI:
     - Check if filename is in excluded list → skip
     - If it's a file → add to map
     - If it's a directory → use `findFiles` to recursively find all files, excluding:
       - Patterns from `copyWithContext.excludedPaths` setting
       - Default exclusions: `.git/**`, `node_modules/**`, etc.

### Phase 2: Parallel File Processing
1. **Input**: Array of unique file URIs
2. **Process** (for each file in parallel):
   - Get file stats
   - **Validation checks** (skip if fails):
     - Is it a directory? → skip
     - Is filename excluded? → skip
     - Is it binary (by extension)? → skip
     - Is it larger than 5MB? → skip
   - Read file content as UTF-8
   - Return `ProcessedFile` object with content and metadata

### Phase 3: Formatting and Output
1. **Input**: Array of processed files (successful + skipped)
2. **Process**:
   - Separate successful files from skipped files
   - For each successful file:
     - Get workspace-relative path
     - Determine markdown language from file extension
     - Trim trailing newlines
     - Create markdown block:
       ```
       #### relative/path/to/file.ts
       ```typescript
       // file content
       ```
       ```
     - **Special case**: Use 6 backticks for `.md` files to avoid conflicts with nested code blocks
   - Join all blocks with `\n\n` separator
   - Copy result to clipboard
   - Show success message in status bar
   - If files were skipped, show warning with counts by reason

## Output Format Example

```markdown
#### src/extension.ts
```typescript
import * as vscode from 'vscode';
// ... file content ...
```

#### README.md
``````markdown
# Project Title
```javascript
// nested code block
```
``````
```

## Performance Optimizations

- **Deduplication**: Uses Map to prevent processing same file multiple times
- **Parallel Processing**: `Promise.all()` processes all files concurrently
- **Caching**: Excluded paths are cached and only reloaded on config changes
- **Recursion Limit**: Maximum 5000 files to prevent infinite loops
