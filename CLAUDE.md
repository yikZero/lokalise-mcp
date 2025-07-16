# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for Lokalise localization platform. It provides a single tool `create-keys` that allows creating localization keys with translations in a Lokalise project.

## Architecture

- **Single-file MCP server** (`src/index.ts`) - The entire server implementation
- **MCP SDK integration** - Uses `@modelcontextprotocol/sdk` for server framework
- **Lokalise API client** - Uses `@lokalise/node-api` for Lokalise API interactions
- **TypeScript with ES modules** - Modern Node.js setup with ES2022 target

## Required Environment Variables

The server requires these environment variables to function:
- `LOKALISE_API_KEY` - Your Lokalise API key
- `PROJECT_ID` - The Lokalise project ID to operate on

## Development Commands

```bash
# Build the project (compiles TypeScript and makes executable)
pnpm run build

# Install dependencies
pnpm install
```

## Project Structure

- `src/index.ts` - Main MCP server implementation with the `create-keys` tool
- `build/` - Compiled JavaScript output (created by build command)
- `tsconfig.json` - TypeScript configuration for Node16 modules with ES2022 target

## Key Implementation Details

- The server runs on stdio transport for MCP communication
- Single tool `create-keys` creates localization keys with optional translations
- Uses Zod for parameter validation and type safety
- Error handling returns structured error responses to the MCP client
- Platforms are hardcoded to `["web", "ios", "android", "other"]` in the implementation

## Package Manager

Uses `pnpm` as the package manager (specified in packageManager field).