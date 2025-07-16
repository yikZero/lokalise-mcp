import { FastMCP } from "fastmcp";
import { LokaliseApi } from "@lokalise/node-api";
import { z } from "zod";

const LOKALISE_API_KEY = process.env.LOKALISE_API_KEY;
const PROJECT_ID = process.env.PROJECT_ID;

if (!LOKALISE_API_KEY || !PROJECT_ID) {
  throw new Error(
    "Missing required environment variables: LOKALISE_API_KEY and PROJECT_ID"
  );
}

const lokaliseApi = new LokaliseApi({ apiKey: LOKALISE_API_KEY });

const server = new FastMCP({
  name: "lokalise",
  version: "1.0.0",
});

server.addTool({
  name: "create-keys",
  description: "Creates one or more keys in the project.",
  parameters: z.object({
    keyName: z.string().describe("Key identifier"),
    description: z.string().optional().describe("Key description"),
    translations: z
      .array(
        z.object({
          language_iso: z
            .string()
            .describe("Unique code of the language of the translation"),
          translation: z.string().describe("The actual translation"),
        })
      )
      .optional()
      .describe("Translations for all languages"),
  }),
  annotations: {
    title: "Create Lokalise Keys",
  },
  execute: async (args) => {
    const result = await lokaliseApi.keys().create(
      {
        keys: [
          {
            key_name: args.keyName,
            description: args.description,
            platforms: ["web", "ios", "android", "other"],
            translations: args.translations,
          },
        ],
      },
      { project_id: PROJECT_ID }
    );

    return {
      content: [
        {
          type: "text",
          text: `Created key: ${args.keyName}\n\nAPI Response: ${JSON.stringify(
            result,
            null,
            2
          )}`,
        },
      ],
    };
  },
});

server.start({
  transportType: "stdio",
});
