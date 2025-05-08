import * as vscode from 'vscode';
import { copySelectionWithContextCommand, copySelectedCodeWithContextCommand } from './commands';
import { COMMAND_ID, SELECTED_CODE_COMMAND_ID, initConfigWatcher, DEFAULT_EXCLUDED_ITEMS, invalidateCache } from './constants';

// Status bar item for showing temporary messages
let statusBarItem: vscode.StatusBarItem;

/**
 * Interactive command to edit excluded paths
 * Provides a simplified interface with staged changes that are only applied when dialog is closed
 */
async function editExcludedPathsCommand() {
    console.log('editExcludedPathsCommand invoked');
    // Get current configuration
    const config = vscode.workspace.getConfiguration('copyWithContext');
    const currentPaths = config.get<string[]>('excludedPaths', DEFAULT_EXCLUDED_ITEMS as string[]);
    
    // Create a copy of the current paths for tracking staged changes
    let stagedPaths = [...currentPaths];
    
    // Keep track of which items are disabled/enabled
    const disabledPaths = new Set<string>();
    
    // Track if a reset to defaults was requested
    let resetToDefaultsRequested = false;
    
    // Track the visible item for maintaining scroll position
    let lastVisibleItemPath: string | null = null;
    
    // String constants for button labels to ensure consistency
    const LABEL_RESET_TO_DEFAULTS = '$(history) Restore defaults';
    const LABEL_RESET_PENDING = '$(history) Add back original defaults (Pending)';
    const LABEL_ADD_NEW = '$(add) Add new exclusion...';
    
    // Helper: get all custom paths
    const getCustomPaths = () => stagedPaths.filter(path => !DEFAULT_EXCLUDED_ITEMS.includes(path as any));
    
    // Create and show the quick pick
    const quickPick = vscode.window.createQuickPick();
    quickPick.placeholder = 'Add new exclusions, toggle existing ones, or reset to defaults';
    quickPick.title = 'Manage Excluded Paths (changes applied when dialog is closed)';
    quickPick.ignoreFocusOut = true;
    
    // Add item for adding new exclusions - will be included in every refresh
    const addNewLabel = LABEL_ADD_NEW;
    
    // Add item for resetting to defaults
    const resetItem = {
        label: LABEL_RESET_TO_DEFAULTS,
        description: 'Restore default exclusion paths',
        detail: 'Will reset to defaults when dialog is closed (click to cancel)',
        path: null,
        isSpecialAction: true,
        alwaysShow: true
    };
    
    // Helper to remember the current visible item
    const rememberVisibleItem = () => {
        // Try to find an item roughly in the middle of the visible area
        // This is a better anchor point than the selected/clicked item
        const items = quickPick.items as any[];
        if (items.length === 0){
            return;
        }
        
        // First try to use the active item as reference
        if (quickPick.activeItems.length > 0) {
            const activeItem = quickPick.activeItems[0] as any;
            if (activeItem && activeItem.path) {
                lastVisibleItemPath = activeItem.path;
                return;
            }
        }
        
        // Otherwise try to use one of the visible items
        // We'll use the first one with a path as a fallback
        for (const item of items) {
            if (item.path && !item.isSpecialAction) {
                lastVisibleItemPath = item.path;
                return;
            }
        }
    };
    
    // Helper to restore the scroll position after refreshing items
    const restoreScrollPosition = () => {
        if (!lastVisibleItemPath)
            {
                return;
            }
        
        // Find the item with the matching path
        const items = quickPick.items as any[];
        const matchingIndex = items.findIndex(item => 
            item.path === lastVisibleItemPath && !item.isSpecialAction
        );
        
        // If found, make it the active item to maintain scroll position
        if (matchingIndex >= 0) {
            quickPick.activeItems = [items[matchingIndex]];
        } 
        // If not found (maybe it was filtered out), try to keep approximate position
        else {
            const pathItems = items.filter(item => item.path && !item.isSpecialAction);
            if (pathItems.length > 0) {
                // Choose an item near the middle of the list as fallback
                const middleIndex = Math.floor(pathItems.length / 2);
                quickPick.activeItems = [pathItems[middleIndex]];
            }
        }
    };
    
    // Function to handle adding a new exclusion
    const handleAddNewExclusion = async (initialValue = '') => {
        // If reset was requested, cancel it when adding new paths
        if (resetToDefaultsRequested) {
            resetToDefaultsRequested = false;
        }
        
        // Get the text to potentially add
        let textToAdd = initialValue;
        
        // If no initial value was provided but there's text in the search box, use that
        if (!textToAdd && quickPick.value && quickPick.value.trim() !== '' && 
            !quickPick.value.trim().startsWith('$(add)')) {
            textToAdd = quickPick.value.trim();
        }
        
        // If we have text to add directly, add it without showing the input box
        if (textToAdd) {
            // Add if not a duplicate
            if (!stagedPaths.includes(textToAdd)) {
                stagedPaths.push(textToAdd);
                // Show confirmation
                vscode.window.showInformationMessage(`Added '${textToAdd}' to excluded paths (will be applied when dialog is closed).`);
                
                // Clear the filter value
                quickPick.value = '';
                
                // Refresh the items
                refreshItems();
                return;
            } else {
                vscode.window.showInformationMessage(`'${textToAdd}' is already in the excluded paths.`);
                return;
            }
        }
        
        // If no text is available, show the input box
        // Temporarily hide the quickpick
        quickPick.hide();
        
        // Show input box for new path
        const newPath = await vscode.window.showInputBox({
            placeHolder: 'Enter path to exclude (e.g., vendor)',
            prompt: 'Enter a filename or directory name to exclude',
            title: 'Add New Exclusion',
            value: quickPick.value.trim(), // Pre-fill with current search text
            ignoreFocusOut: true
        });
        
        // Add the new path if provided and not a duplicate
        if (newPath && newPath.trim() !== '') {
            const trimmedPath = newPath.trim();
            if (!stagedPaths.includes(trimmedPath)) {
                stagedPaths.push(trimmedPath);
                // Show confirmation
                vscode.window.showInformationMessage(`Added '${trimmedPath}' to excluded paths (will be applied when dialog is closed).`);
            } else {
                vscode.window.showInformationMessage(`'${trimmedPath}' is already in the excluded paths.`);
            }
        }
        
        // Clear the filter value
        quickPick.value = '';
        
        // Update items and show quickpick again
        refreshItems();
        quickPick.show();
    };
    
    // Function to refresh the items in the quickpick
    const refreshItems = () => {
        // Style reflects whether reset is pending
        const pathItems = stagedPaths.map(path => {
            const isDefaultPath = DEFAULT_EXCLUDED_ITEMS.includes(path as any);
            // Custom paths are only disabled if the user manually disabled them, regardless of reset state
            const isDisabled = disabledPaths.has(path);
            
            return {
                label: isDisabled 
                    ? `$(circle-slash) $(x) ${path}` 
                    : `$(check) ${path}`,
                description: isDisabled 
                    ? 'Currently disabled (click to re-enable)' 
                    : 'Click to disable',
                detail: isDefaultPath 
                    ? 'Default exclusion' 
                    : (isDisabled ? 'Will be removed when dialog is closed' : 'Custom exclusion'),
                path: path,
                isDisabled: isDisabled,
                isDefaultPath: isDefaultPath,
                isSpecialAction: false,
                // Buttons depend on enabled/disabled state
                buttons: [{
                    iconPath: new vscode.ThemeIcon(isDisabled ? 'check' : 'circle-slash'),
                    tooltip: isDisabled ? `Re-enable ${path}` : `Disable ${path}`
                }]
            };
        });
        
        // Sort the items: custom paths first, then default paths
        pathItems.sort((a, b) => {
            // If one is custom and one is default, prioritize custom
            if (a.isDefaultPath !== b.isDefaultPath) {
                return a.isDefaultPath ? 1 : -1; // Custom paths (non-default) first
            }
            // Otherwise sort alphabetically
            return a.path.localeCompare(b.path);
        });
        
        // Update reset item styling based on state
        resetItem.label = resetToDefaultsRequested 
            ? LABEL_RESET_PENDING 
            : LABEL_RESET_TO_DEFAULTS;
        resetItem.detail = resetToDefaultsRequested
            ? 'Will add back original defaults when dialog is closed (click to cancel)'
            : 'Restore default paths';
            
        // Create add new item that includes the current filter value if present
        const addItem = {
            label: quickPick.value && quickPick.value.trim() !== '' && !quickPick.value.includes('$(add)')
                ? `$(add) Add "${quickPick.value.trim()}"...`
                : addNewLabel,
            description: 'Add a new path to exclude',
            path: null,
            isSpecialAction: true,
            alwaysShow: true
        };
        
        // Combine all items
        quickPick.items = [...pathItems, addItem, resetItem];
    };
    
    // Initial refresh
    refreshItems();
    
    // Handle button clicks for toggling paths
    quickPick.onDidTriggerItemButton(event => {
        const item = event.item as any;
        
        if (item.path && !item.isSpecialAction) {
            // Remember the current visible area before making changes
            rememberVisibleItem();
            
            if (disabledPaths.has(item.path)) {
                disabledPaths.delete(item.path);
            } else {
                disabledPaths.add(item.path);
            }
            
            // Refresh the items
            refreshItems();
            
            // Restore scroll position
            restoreScrollPosition();
        }
    });
    
    // Add a handler for when the input value changes
    quickPick.onDidChangeValue(() => {
        // Remember visible area before filtering
        rememberVisibleItem();
        
        // Update the items to reflect the current search text
        refreshItems();
        
        // Don't restore scroll position on filter - we want to see the matches
        // Only restore if the filter is cleared
        if (!quickPick.value) {
            restoreScrollPosition();
        }
    });
    
    // Handle accepting an item
    quickPick.onDidAccept(async () => {
        if (quickPick.selectedItems.length > 0) {
            const selected = quickPick.selectedItems[0] as any;
            
            // Handle "Add new exclusion" option
            if (selected.isSpecialAction && selected.label.includes('$(add)')) {
                // Extract the path from the label if it contains a quoted string
                const match = selected.label.match(/\"(.*?)\"/);
                if (match && match[1]) {
                    // If we have a quoted string, add it directly
                    await handleAddNewExclusion(match[1]);
                } else {
                    // Otherwise just call the handler with the current input
                    await handleAddNewExclusion(quickPick.value.trim());
                }
                return;
            }
            
            // Handle "Reset to defaults" option
            if (selected.isSpecialAction && 
                (selected.label === LABEL_RESET_TO_DEFAULTS || 
                 selected.label === LABEL_RESET_PENDING)) {
                // Remember the visible area before making changes
                rememberVisibleItem();
                
                // Toggle reset state
                resetToDefaultsRequested = !resetToDefaultsRequested;
                if (resetToDefaultsRequested) {
                    // When reset is requested, ensure all default paths are present
                    let added = false;
                    DEFAULT_EXCLUDED_ITEMS.forEach(path => {
                        if (!stagedPaths.includes(path)) {
                            stagedPaths.push(path);
                            added = true;
                        }
                    });
                    if (added) {
                        vscode.window.showInformationMessage('Default exclusions restored. Custom exclusions are unchanged.');
                    } else {
                        vscode.window.showInformationMessage('Reset to defaults requested. Custom exclusions are unchanged.');
                    }
                }
                
                // Refresh items
                refreshItems();
                
                // Restore scroll position
                restoreScrollPosition();
                return;
            }
            
            // Handle regular path items
            if (selected.path && !selected.isSpecialAction) {
                // Remember the visible area before making changes
                rememberVisibleItem();
                
                if (disabledPaths.has(selected.path)) {
                    disabledPaths.delete(selected.path);
                } else {
                    disabledPaths.add(selected.path);
                }
                
                // Refresh items 
                refreshItems();
                
                // Restore scroll position
                restoreScrollPosition();
                return;
            }
        }
        
        // If no item is selected or if the filter doesn't match any existing item,
        // treat the current input as a new exclusion to add
        if (quickPick.value.trim() !== '') {
            await handleAddNewExclusion(quickPick.value.trim());
        }
    });
    
    // Handle dialog closing - apply changes
    quickPick.onDidHide(async () => {
        let finalPaths: string[] = [];
        if (resetToDefaultsRequested) {
            // Keep default paths that weren't manually disabled
            const defaultsToKeep = DEFAULT_EXCLUDED_ITEMS.filter(path => !disabledPaths.has(path as string));
            // Keep custom paths that weren't disabled
            const customToKeep = getCustomPaths().filter(path => !disabledPaths.has(path));
            finalPaths = [...defaultsToKeep as string[], ...customToKeep];
        } else {
            finalPaths = stagedPaths.filter(path => !disabledPaths.has(path));
        }
        
        // Check if changes were made
        const pathsChanged = 
            finalPaths.length !== currentPaths.length || 
            finalPaths.some(path => !currentPaths.includes(path)) ||
            currentPaths.some(path => !finalPaths.includes(path));
        
        if (pathsChanged) {
            // Update configuration with final paths
            await config.update('excludedPaths', finalPaths, vscode.ConfigurationTarget.Global);
            
            // Force cache invalidation
            invalidateCache();
            
            // Show summary of changes
            if (resetToDefaultsRequested) {
                vscode.window.showInformationMessage('Excluded paths reset to defaults.');
            } else {
                const addedCount = finalPaths.filter(path => !currentPaths.includes(path)).length;
                const removedCount = currentPaths.filter(path => !finalPaths.includes(path)).length;
                const message = `Excluded paths updated: ${addedCount} added, ${removedCount} removed`;
                vscode.window.showInformationMessage(message);
            }
        }
    });
    
    // Show the quick pick
    quickPick.show();
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100 // Priority (higher number = more to the left)
    );
    context.subscriptions.push(statusBarItem);

    console.log('"context-copy" extension is now active!');
    
    // Initialize the cache invalidation watcher for excluded paths
    initConfigWatcher(context);

    // Register the file selection copy command
    const copyCommandDisposable = vscode.commands.registerCommand(
        COMMAND_ID,
        (uri: vscode.Uri, allUris: vscode.Uri[]) => copySelectionWithContextCommand(uri, allUris, statusBarItem)
    );
    context.subscriptions.push(copyCommandDisposable);

    // Register the selected code copy command
    const selectedCodeCommandDisposable = vscode.commands.registerCommand(
        SELECTED_CODE_COMMAND_ID,
        () => copySelectedCodeWithContextCommand(statusBarItem)
    );
    context.subscriptions.push(selectedCodeCommandDisposable);

    // Register the edit excluded paths command
    const editExcludedPathsCommandDisposable = vscode.commands.registerCommand(
        'contextCopy.editExcludedPaths',
        editExcludedPathsCommand
    );
    context.subscriptions.push(editExcludedPathsCommandDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('"context-copy" extension is now deactivated.');
    // Perform any cleanup if necessary
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}