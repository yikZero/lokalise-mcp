# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for Lokalise localization platform. It provides multiple tools for managing localization keys and translations in a Lokalise project.

## Architecture

- **Single-file MCP server** (`src/index.ts`) - The entire server implementation
- **MCP SDK integration** - Uses `@modelcontextprotocol/sdk` for server framework
- **Lokalise API client** - Uses `@lokalise/node-api` for Lokalise API interactions  
- **TypeScript with ES modules** - Modern Node.js setup with ES2022 target
- **Zod validation** - Parameter validation and type safety

## Required Environment Variables

The server requires these environment variables to function:
- `LOKALISE_API_KEY` - Your Lokalise API key
- `DEFAULT_PROJECT_ID` - The Lokalise project ID to operate on
- `PLATFORMS` - Optional comma-separated list of platforms (defaults to "web,ios,android,other")

## Development Commands

```bash
# Build the project (compiles TypeScript and makes executable)
pnpm run build

# Install dependencies
pnpm install

# Run the compiled server directly (after build)
./build/index.js

# Use as CLI tool (after build)
lokalise
```

## Available MCP Tools

The server provides these tools for MCP clients:

1. **`get-project-info`** - Retrieves project information using DEFAULT_PROJECT_ID
2. **`create-keys`** - Creates localization keys with translations for specified platforms
3. **`search-keys`** - Searches for keys by name in a project
4. **`update-keys`** - Updates existing keys with new translations

## Key Implementation Details

- The server runs on stdio transport for MCP communication
- All tools use Zod schemas for parameter validation
- Error handling returns structured error responses to the MCP client
- Platforms can be configured via environment variable but default to `["web", "ios", "android", "other"]`
- The binary is made executable via `chmod 755` during build process
- Console output uses `console.error()` to avoid interfering with MCP protocol on stdout

## Project Structure

- `src/index.ts` - Main MCP server implementation with all tools
- `build/` - Compiled JavaScript output (created by build command)
- `package.json` - Defines binary at `./build/index.js` accessible via `lokalise` command
- `tsconfig.json` - TypeScript configuration for Node16 modules with ES2022 target
- `.env.example` - Template for required environment variables
- `MCP-SERVER-USAGE.md` - Detailed documentation in Chinese about MCP server usage

## Package Manager

Uses `pnpm` as the package manager (specified in packageManager field).

## Development Notes

- **No testing framework** is currently configured - consider adding tests for the MCP tools
- **ES Modules**: Project uses modern ES module setup with `"type": "module"` in package.json
- **Binary compilation**: Build process makes the output executable with `chmod 755`
- **MCP Protocol**: Server communicates via stdio transport, so all debug output must use stderr
- **Single file architecture**: All server logic is contained in one file for simplicity