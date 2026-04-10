# stacktrace-link

> CLI that parses Node.js stack traces and opens the relevant file/line directly in your editor

## Installation

```bash
npm install -g stacktrace-link
```

## Usage

Pipe a stack trace directly into `stacktrace-link` and it will parse the output, present an interactive list of frames, and open your chosen file at the exact line in your configured editor.

```bash
node my-script.js 2>&1 | stacktrace-link
```

Or pass a saved stack trace file:

```bash
stacktrace-link error.log
```

### Editor Configuration

Set your preferred editor via the `EDITOR` or `VISUAL` environment variable:

```bash
export EDITOR="code --goto"   # VS Code
export EDITOR="webstorm"      # JetBrains WebStorm
export EDITOR="vim"           # Vim
```

### Example

```
$ node app.js 2>&1 | stacktrace-link

TypeError: Cannot read properties of undefined (reading 'id')
  ❯ 1  src/controllers/user.ts:42
    2  src/middleware/auth.ts:17
    3  src/app.ts:8

Opening src/controllers/user.ts at line 42...
```

## Requirements

- Node.js >= 16
- A configured `EDITOR` environment variable

## License

[MIT](LICENSE)