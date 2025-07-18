#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { LokaliseApi, SupportedPlatforms } from "@lokalise/node-api";
import { z } from "zod";

const LOKALISE_API_KEY = process.env.LOKALISE_API_KEY;
const DEFAULT_PROJECT_ID = process.env.DEFAULT_PROJECT_ID;
const PLATFORMS = (process.env.PLATFORMS?.split(",").map((p) => p.trim()) || [
  "web",
  "ios",
  "android",
  "other",
]) as SupportedPlatforms[];

const lokaliseApi = new LokaliseApi({ apiKey: LOKALISE_API_KEY });

const server = new McpServer(
  {
    name: "lokalise-mcp",
    version: "1.0.0",
    author: "yikZero",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.tool(
  "get-project-info",
  `Retrieves a project object, acquire basic information. If user provides a projectId, use it. Otherwise, use the default projectId: ${DEFAULT_PROJECT_ID}`,
  {
    projectId: z.string().describe("A unique project identifier"),
  },
  async (args) => {
    const { projectId } = args;
    const projectIdToUse = projectId || DEFAULT_PROJECT_ID;

    if (!projectIdToUse) {
      throw new Error("No project ID provided, please set DEFAULT_PROJECT_ID");
    }

    const response = await lokaliseApi.projects().get(projectIdToUse);

    return {
      content: [
        {
          text: JSON.stringify(response, null, 2),
          type: "text",
        },
      ],
    };
  }
);

server.tool(
  "search-keys",
  "Find the corresponding keyid by keyname",
  {
    projectId: z.string().describe("A unique project identifier"),
    filterKeys: z
      .string()
      .describe("One or more key name to filter by (comma separated)"),
  },
  async (args) => {
    const { projectId, filterKeys } = args;
    const response = await lokaliseApi.keys().list({
      project_id: projectId,
      filter_keys: filterKeys,
    });

    return {
      content: [
        {
          text: JSON.stringify(response, null, 2),
          type: "text",
        },
      ],
    };
  }
);

server.tool(
  "create-keys",
  "Creates one or more keys in the project",
  {
    projectId: z
      .string()
      .describe(
        "A unique project identifier, if not provide, first use get-project-info tool to get the project id"
      ),
    keys: z.array(
      z.object({
        keyName: z.string().describe("Key identifier"),
        platforms: z
          .array(z.enum(["web", "ios", "android", "other"]))
          .describe(
            "Platforms for the key. If not provided, use the default platforms: " +
              PLATFORMS.join(", ")
          ),
        translations: z
          .array(
            z.object({
              languageIso: z
                .string()
                .describe("Unique code of the language of the translation"),
              translation: z
                .string()
                .describe("The actual translation. Pass as an object"),
            })
          )
          .describe("Translations for all languages"),
      })
    ),
  },
  async (args) => {
    const { projectId, keys } = args;
    const response = await lokaliseApi.keys().create(
      {
        keys: keys.map((key: any) => ({
          key_name: key.keyName,
          platforms: key.platforms,
          translations: key.translations.map((t: any) => ({
            language_iso: t.languageIso,
            translation: t.translation,
          })),
        })),
      },
      { project_id: projectId }
    );

    return {
      content: [
        {
          text: JSON.stringify(response, null, 2),
          type: "text",
        },
      ],
    };
  }
);

server.tool(
  "update-keys",
  "Updates one or more keys in the project",
  {
    projectId: z.string().describe("A unique project identifier"),
    keys: z.array(
      z.object({
        keyId: z.string().describe("A unique identifier of the key"),
        translations: z
          .array(
            z.object({
              languageIso: z
                .string()
                .describe("Unique code of the language of the translation"),
              translation: z
                .string()
                .describe("The actual translation. Pass as an object"),
            })
          )
          .describe("Translations for all languages"),
      })
    ),
  },
  async (args) => {
    const { projectId, keys } = args;
    const response = await lokaliseApi.keys().bulk_update(
      {
        keys: keys.map((key: any) => ({
          key_id: key.keyId,
          translations: key.translations.map((t: any) => ({
            language_iso: t.languageIso,
            translation: t.translation,
          })),
        })),
      },
      { project_id: projectId }
    );

    return {
      content: [
        {
          text: JSON.stringify(response, null, 2),
          type: "text",
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lokalise MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
