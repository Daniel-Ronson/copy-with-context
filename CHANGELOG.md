# Change Log

All notable changes to the "copy-with-context" extension will be documented in this file.

## [1.5.4] - 2026-01-24

### Fixed
- Fixed race condition where excluded paths could be inconsistently applied during folder expansion
- Exclusion settings are now loaded once at command start, preventing issues when configuration cache is invalidated mid-execution

### Added
- Comprehensive test suite for exclusion functionality
- Documentation for available commands in README

## [1.5.0] - 05-06-2025

### Added
- Interactive UI for editing the excluded files/folders. from command pallete (shift+cmd+p) and look for "Copy Context: Edit Excluded Paths", this will open the quick pick dialogue to add/remove files
- Reduced extension bundle size by 93%
- Performance optimizations with caching of excluded paths