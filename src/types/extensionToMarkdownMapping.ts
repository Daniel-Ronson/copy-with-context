
export const fileExtensionToMarkdown: Record<string, string> = {
  // JavaScript family
  ".js": "js",
  ".jsx": "jsx",
  ".ts": "ts",
  ".tsx": "tsx",
  ".mjs": "js",
  ".cjs": "js",
  ".json": "json",
  ".jsonc": "jsonc",
  
  // Web
  ".html": "html",
  ".htm": "html",
  ".css": "css",
  ".scss": "scss",
  ".sass": "scss",
  ".less": "less",
  ".svg": "svg",
  
  // Markup
  ".md": "markdown",
  ".markdown": "markdown",
  ".xml": "xml",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "toml",
  
  // Shell/Scripts
  ".sh": "bash",
  ".bash": "bash",
  ".zsh": "bash",
  ".fish": "fish",
  ".ps1": "powershell",
  ".bat": "batch",
  ".cmd": "batch",
  
  // Python
  ".py": "python",
  ".pyi": "python",
  ".ipynb": "python",
  
  // Ruby
  ".rb": "ruby",
  ".erb": "erb",
  
  // PHP
  ".php": "php",
  ".phtml": "php",
  
  // Java/JVM
  ".java": "java",
  ".kt": "kotlin",
  ".kts": "kotlin",
  ".scala": "scala",
  ".groovy": "groovy",
  ".gradle": "gradle",
  
  // C-family
  ".c": "c",
  ".h": "c",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".cxx": "cpp",
  ".hpp": "cpp",
  ".hxx": "cpp",
  ".cs": "csharp",
  ".m": "objectivec",
  ".mm": "objectivec",
  ".swift": "swift",
  ".go": "go",
  ".rs": "rust",
  
  // .NET
  ".fs": "fsharp",
  ".fsx": "fsharp",
  ".vb": "vb",
  
  // Databases
  ".sql": "sql",
  ".graphql": "graphql",
  ".gql": "graphql",
  
  // Config files
  ".ini": "ini",
  ".conf": "conf",
  ".cfg": "ini",
  ".env": "dotenv",
  ".properties": "properties",
  ".htaccess": "apache",
  ".nginx": "nginx",
  ".dockerignore": "docker",
  ".gitignore": "git",
  ".gitattributes": "git",
  
  // Build tools
  ".mk": "makefile",
  ".makefile": "makefile",
  
  // Hashicorp
  ".tf": "terraform",
  ".hcl": "hcl",
  
  // Misc
  ".tex": "latex",
  ".diff": "diff",
  ".patch": "diff",
  ".log": "log",
  ".txt": "text",
  ".csv": "csv",
  ".tsv": "tsv",
  ".sol": "solidity",
  ".elm": "elm",
  ".clj": "clojure",
  ".cljs": "clojure",
  ".edn": "clojure",
  ".lisp": "lisp",
  ".r": "r",
  ".rmd": "r",
  ".dart": "dart",
  ".ex": "elixir",
  ".exs": "elixir",
  ".erl": "erlang",
  ".hs": "haskell",
  ".lhs": "haskell",
  ".lua": "lua",
  ".ml": "ocaml",
  ".mli": "ocaml",
  ".pl": "perl",
  ".pm": "perl",
  ".raku": "raku",
  ".zig": "zig",
  ".dockerfile": "dockerfile"
};

/**
 * Special filenames without extensions
 */
export const specialFilenames: Record<string, string> = {
  ".editorconfig": "editorconfig",
  ".eslintrc": "json",
  ".prettierrc": "json",
  ".stylelintrc": "json",
  "CMakeLists.txt": "cmake",
  ".gitconfig": "git",
  "CODEOWNERS": "text",
  "LICENSE": "text",
  "README": "markdown",
  "CONTRIBUTING": "markdown",
  "Jenkinsfile": "groovy",
  "docker-compose.yml": "yaml",
  "docker-compose.yaml": "yaml",
  "Dockerfile": "dockerfile",
  "Makefile": "makefile",
  "makefile": "makefile",
  "Rakefile": "ruby",
  "Gemfile": "ruby",
  "Cargo.toml": "toml",
  "package.json": "json",
  "tsconfig.json": "json",
  "webpack.config.js": "js",
  "babel.config.js": "js",
  ".babelrc": "json"
};