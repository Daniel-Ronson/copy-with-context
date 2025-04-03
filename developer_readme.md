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

## Notes about how vscode extensions work
 - package.json contains many important things: right click menu items, and commands need to registered here
 - all functionality an extension offers are usually registered as "commands" in both package.json and extension.ts
 - the extension code isnt loaded into memory until it is used, its only 2mb so can be lazy loaded easily. typically the triggers for loading the code are defined in activationEvents in package.json, however commands automatically treated with the "onCommand" activation event trigger.