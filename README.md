# Lokalise MCP Server

Model Context Protocol (MCP) server for Lokalise localization platform. This server provides tools for managing localization keys and translations in your Lokalise project.

## Installation

```bash
# Using npx (no installation needed)
npx @yikzero/lokalise-mcp

# Or install globally
npm install -g @yikzero/lokalise-mcp

# Using pnpm
pnpm add -g @yikzero/lokalise-mcp
```

## Configuration

Set up the required environment variables:

```bash
LOKALISE_API_KEY=your_api_key_here
DEFAULT_PROJECT_ID=your_project_id_here
PLATFORMS=web,ios,android,other  # Optional, defaults shown
```

You can create a `.env` file or set these in your system environment.

## Usage

### As MCP Server

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "lokalise": {
      "command": "npx",
      "args": ["-y", "@yikzero/lokalise-mcp"],
      "env": {
        "LOKALISE_API_KEY": "your_api_key",
        "DEFAULT_PROJECT_ID": "your_project_id"
      }
    }
  }
}
```

### As CLI

```bash
lokalise
```

## Available Tools

- **get-project-info** - Retrieve project information
- **create-keys** - Create localization keys with translations
- **search-keys** - Search for keys by name
- **update-keys** - Update existing keys with new translations

See [CLAUDE.md](./CLAUDE.md) for detailed tool documentation.

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Run locally
./build/index.js
```

## License

MIT

## Author

yikZero

## Repository

[https://github.com/yikZero/lokalise-mcp](https://github.com/yikZero/lokalise-mcp)
