# Copy With Context - Overall Architecture

This diagram shows the high-level architecture of the VSCode extension and how the main components interact.

```mermaid
graph TB
    subgraph "VSCode Extension Host"
        User[User Interactions]
    end

    subgraph "Extension Entry Point"
        Activate[extension.ts::activate]
        Deactivate[extension.ts::deactivate]
        StatusBar[Status Bar Item]
    end

    subgraph "Commands"
        Cmd1[copySelectionWithContextCommand]
        Cmd2[copySelectedCodeWithContextCommand]
        Cmd3[editExcludedPathsCommand]
    end

    subgraph "Core Processing"
        FileProc[fileProcessor.ts]
        GetUnique[getUniqueFileUrisFromSelection]
        ProcessUri[processUri]
    end

    subgraph "Utilities"
        FileUtils[fileUtils.ts]
        FormatUtils[formattingUtils.ts]
        StatusUtils[statusBarUtils.ts]
        Constants[constants.ts]
    end

    subgraph "Configuration"
        Settings[VSCode Settings]
        Cache[Excluded Paths Cache]
        Watcher[Config Change Watcher]
    end

    User -->|Right-click files/folders| Cmd1
    User -->|Right-click selected code| Cmd2
    User -->|Command Palette| Cmd3

    Activate --> Cmd1
    Activate --> Cmd2
    Activate --> Cmd3
    Activate --> StatusBar
    Activate --> Watcher

    Cmd1 --> GetUnique
    GetUnique --> ProcessUri
    ProcessUri --> FileProc

    Cmd2 --> FormatUtils

    Cmd3 --> Settings
    Cmd3 --> Cache

    FileProc --> FileUtils
    FileProc --> FormatUtils

    ProcessUri --> FileUtils
    ProcessUri --> Constants

    Cmd1 --> StatusUtils
    Cmd2 --> StatusUtils
    Cmd3 --> StatusUtils

    Watcher -.->|Invalidates| Cache
    Settings -.->|Reads| Constants

    Cmd1 -->|Writes| Clipboard[VSCode Clipboard]
    Cmd2 -->|Writes| Clipboard

    StatusUtils --> StatusBar

    style User fill:#e1f5ff
    style Clipboard fill:#e1f5ff
    style Settings fill:#fff4e1
    style Cache fill:#fff4e1
```

## Component Descriptions

### Extension Entry Point
- **extension.ts**: Manages extension lifecycle, registers commands, creates status bar, and sets up configuration watchers

### Commands
- **copySelectionWithContextCommand**: Copies selected files/folders from Explorer in markdown format
- **copySelectedCodeWithContextCommand**: Copies selected code from editor with file path and line numbers
- **editExcludedPathsCommand**: Interactive UI for managing excluded paths configuration

### Core Processing
- **fileProcessor.ts**: Processes individual files (type checking, size validation, content reading)
- **getUniqueFileUrisFromSelection**: Expands folders and deduplicates file URIs
- **processUri**: Processes individual file URIs

### Utilities
- **fileUtils.ts**: File operations (binary detection, reading, path handling)
- **formattingUtils.ts**: Markdown formatting logic
- **statusBarUtils.ts**: Status bar message handling
- **constants.ts**: Configuration management with caching

### Configuration
- **VSCode Settings**: User configuration storage
- **Excluded Paths Cache**: Performance optimization for frequently accessed settings
- **Config Change Watcher**: Invalidates cache when settings change
