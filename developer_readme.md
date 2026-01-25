# Developer guide

## How to compile/debug
1. Navigate to extension.ts file and hit or (f5)
2. Or use the launch config "run extension"
- Both these methods compile the code, and open an external vscode window which can be used for testing changes
- You can set breakpoints in the original vscode window and debug

## Packaging and Deploying vscode extension
1. run command ```vsce package``` to create the .vsix binary which is the extension
2. Push latest changes to github master branch
3. Upload this to visual studio extension marketplace here: https://marketplace.visualstudio.com/manage/publishers/copy-context

## Release Checklist

### 1. Update version and changelog
- Bump version in `package.json` (line 6)
- Add entry to `CHANGELOG.md` with the new version, date, and changes

### 2. Verify everything works
```bash
pnpm run compile    # Type-check, lint, and build
pnpm run lint       # Run ESLint
pnpm run test       # Run tests
```

### 3. Package the extension
```bash
vsce package
```
This creates a `.vsix` file (e.g., `copy-with-context-1.5.4.vsix`)

### 4. Push to GitHub
```bash
git add -A && git commit -m "Bump to x.x.x" && git push origin main
```

### 5. Upload to Marketplace
Go to: https://marketplace.visualstudio.com/manage/publishers/copy-context

Upload the `.vsix` file.

**Alternative:** Publish directly via CLI (requires PAT configured):
```bash
vsce publish
```

## Notes about how vscode extensions work
 - package.json contains many important things: right click menu items, and commands need to registered here
 - all functionality an extension offers are usually registered as "commands" in both package.json and extension.ts
 - the extension code isnt loaded into memory until it is used, its only 2mb so can be lazy loaded easily. typically the triggers for loading the code are defined in activationEvents in package.json, however commands automatically treated with the "onCommand" activation event trigger.