# MCP Server 使用指南

本文档介绍如何使用 Model Context Protocol (MCP) SDK 创建和管理 MCP 服务器。

## 目录

1. [基础概念](#基础概念)
2. [服务器初始化](#服务器初始化)
3. [工具 (Tools)](#工具-tools)
4. [资源 (Resources)](#资源-resources)
5. [提示 (Prompts)](#提示-prompts)
6. [传输和连接](#传输和连接)
7. [完整示例](#完整示例)
8. [最佳实践](#最佳实践)

## 基础概念

MCP Server 是一个高级接口，简化了 MCP 协议的使用。它提供三种主要功能：

- **Tools**: 客户端可以调用的功能函数
- **Resources**: 可读取的数据源
- **Prompts**: 可参数化的提示模板

## 服务器初始化

### 基本设置

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 创建服务器实例
const server = new McpServer(
  {
    name: "my-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},   // 启用资源功能
      tools: {},       // 启用工具功能 
      prompts: {},     // 启用提示功能
    },
  }
);
```

### 服务器信息配置

```typescript
const serverInfo = {
  name: "lokalise-mcp",           // 服务器名称
  version: "1.0.0",              // 版本号
  description: "Lokalise MCP",   // 可选：描述
  author: "Your Name",           // 可选：作者
};
```

## 工具 (Tools)

工具是客户端可以调用的函数。支持多种注册方式：

### 1. 无参数工具

```typescript
// 简单的无参数工具
server.tool("ping", () => {
  return {
    content: [{ type: "text", text: "pong" }]
  };
});

// 带描述的无参数工具
server.tool("get-status", "获取服务器状态", () => {
  return {
    content: [{ type: "text", text: "服务器运行正常" }]
  };
});
```

### 2. 带参数的工具

```typescript
import { z } from "zod";

// 使用 Zod 定义参数模式
const createKeySchema = {
  keyName: z.string().describe("本地化键名"),
  translations: z.record(z.string()).optional().describe("翻译映射"),
  platforms: z.array(z.string()).optional().describe("目标平台")
};

server.tool("create-key", "创建本地化键", createKeySchema, async (args) => {
  const { keyName, translations, platforms } = args;
  
  try {
    // 执行创建逻辑
    const result = await createLocalizationKey(keyName, translations, platforms);
    
    return {
      content: [
        {
          type: "text",
          text: `成功创建键: ${keyName}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text", 
          text: `创建失败: ${error.message}`
        }
      ],
      isError: true
    };
  }
});
```

### 3. 高级工具配置

```typescript
// 使用 registerTool 进行高级配置
server.registerTool("advanced-tool", {
  title: "高级工具",
  description: "具有输入输出模式的工具",
  inputSchema: {
    input: z.string(),
    options: z.object({
      format: z.enum(["json", "xml", "yaml"]),
      pretty: z.boolean().default(true)
    })
  },
  outputSchema: {
    result: z.string(),
    metadata: z.object({
      timestamp: z.string(),
      format: z.string()
    })
  },
  annotations: {
    audience: ["developers"],
    dangerLevel: 1
  }
}, async (args) => {
  // 工具实现
  return {
    structuredContent: {
      result: "处理结果",
      metadata: {
        timestamp: new Date().toISOString(),
        format: args.options.format
      }
    }
  };
});
```

### 4. 工具管理

```typescript
// 注册工具并获取控制对象
const registeredTool = server.tool("my-tool", "工具描述", () => {
  return { content: [{ type: "text", text: "结果" }] };
});

// 禁用工具
registeredTool.disable();

// 启用工具
registeredTool.enable();

// 更新工具
registeredTool.update({
  description: "新的描述",
  callback: () => ({ content: [{ type: "text", text: "新结果" }] })
});

// 移除工具
registeredTool.remove();
```

## 资源 (Resources)

资源提供对数据的读取访问。支持静态 URI 和动态 URI 模板。

### 1. 静态资源

```typescript
// 简单静态资源
server.resource("project-info", "lokalise://project/123", async () => {
  const projectData = await getProjectInfo();
  
  return {
    contents: [
      {
        uri: "lokalise://project/123",
        text: JSON.stringify(projectData, null, 2),
        mimeType: "application/json"
      }
    ]
  };
});

// 带元数据的静态资源
server.resource(
  "project-info",
  "lokalise://project/123", 
  {
    title: "项目信息",
    description: "Lokalise 项目的详细信息",
    mimeType: "application/json"
  },
  async () => {
    // 资源读取逻辑
    return { contents: [...] };
  }
);
```

### 2. 动态资源模板

```typescript
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

// 创建资源模板
const projectTemplate = new ResourceTemplate(
  "lokalise://projects/{projectId}",
  {
    // 列出所有匹配的资源
    list: async () => {
      const projects = await getAllProjects();
      return {
        resources: projects.map(p => ({
          uri: `lokalise://projects/${p.id}`,
          name: `project-${p.id}`,
          title: p.name,
          mimeType: "application/json"
        }))
      };
    },
    
    // 自动完成变量值
    complete: {
      projectId: async (value, context) => {
        const projects = await searchProjects(value);
        return projects.map(p => p.id);
      }
    }
  }
);

// 注册模板资源
server.resource(
  "project-template",
  projectTemplate,
  {
    title: "项目模板",
    description: "通过 ID 访问任意项目"
  },
  async (uri, variables) => {
    const { projectId } = variables;
    const project = await getProject(projectId);
    
    return {
      contents: [
        {
          uri: uri.toString(),
          text: JSON.stringify(project, null, 2),
          mimeType: "application/json"
        }
      ]
    };
  }
);
```

### 3. 资源管理

```typescript
// 注册资源并获取控制对象
const registeredResource = server.resource("my-resource", "scheme://path", async () => {
  return { contents: [...] };
});

// 禁用资源
registeredResource.disable();

// 启用资源
registeredResource.enable();

// 更新资源
registeredResource.update({
  uri: "scheme://new-path",
  callback: async () => ({ contents: [...] })
});

// 移除资源
registeredResource.remove();
```

## 提示 (Prompts)

提示是可参数化的文本模板，用于生成 AI 提示。

### 1. 简单提示

```typescript
// 无参数提示
server.prompt("greeting", () => {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "你好，请帮助我进行本地化工作。"
        }
      }
    ]
  };
});

// 带描述的提示
server.prompt("code-review", "代码审查提示", () => {
  return {
    messages: [
      {
        role: "user", 
        content: {
          type: "text",
          text: "请审查以下代码并提供改进建议。"
        }
      }
    ]
  };
});
```

### 2. 参数化提示

```typescript
// 带参数的提示
const translatePromptArgs = {
  text: z.string().describe("要翻译的文本"),
  targetLanguage: z.string().describe("目标语言"),
  context: z.string().optional().describe("翻译上下文")
};

server.prompt("translate", "翻译提示", translatePromptArgs, (args) => {
  const { text, targetLanguage, context } = args;
  
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `请将以下文本翻译成${targetLanguage}:\n\n${text}\n\n${context ? `上下文: ${context}` : ''}`
        }
      }
    ]
  };
});
```

### 3. 高级提示配置

```typescript
// 使用 registerPrompt 进行配置
server.registerPrompt("advanced-prompt", {
  title: "高级翻译提示", 
  description: "具有详细配置的翻译提示",
  argsSchema: {
    sourceText: z.string(),
    targetLang: z.string(),
    tone: z.enum(["formal", "casual", "technical"]),
    preserveFormatting: z.boolean().default(true)
  }
}, (args) => {
  return {
    messages: [
      {
        role: "system",
        content: {
          type: "text", 
          text: `你是一个专业翻译员。请使用${args.tone}语调进行翻译。`
        }
      },
      {
        role: "user",
        content: {
          type: "text",
          text: `翻译成${args.targetLang}: ${args.sourceText}`
        }
      }
    ]
  };
});
```

## 传输和连接

### 1. 建立连接

```typescript
async function main() {
  // 创建传输（标准输入输出）
  const transport = new StdioServerTransport();
  
  // 连接到传输
  await server.connect(transport);
  
  console.error("MCP Server 已启动"); // 使用 stderr 避免干扰 MCP 协议
}

// 启动服务器
main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});
```

### 2. 连接状态管理

```typescript
// 检查连接状态
if (server.isConnected()) {
  console.error("服务器已连接");
}

// 发送更新通知
server.sendToolListChanged();     // 工具列表已更改
server.sendResourceListChanged(); // 资源列表已更改  
server.sendPromptListChanged();   // 提示列表已更改

// 关闭连接
await server.close();
```

### 3. 其他传输类型

```typescript
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { WebSocketServerTransport } from "@modelcontextprotocol/sdk/server/websocket.js";

// SSE 传输
const sseTransport = new SSEServerTransport("/sse", {
  port: 3000
});

// WebSocket 传输  
const wsTransport = new WebSocketServerTransport({
  port: 3001
});
```

## 完整示例

这是一个完整的 MCP 服务器示例：

```typescript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 环境变量
const API_KEY = process.env.API_KEY;
const PROJECT_ID = process.env.PROJECT_ID;

// 创建服务器
const server = new McpServer(
  {
    name: "example-server",
    version: "1.0.0",
    description: "示例 MCP 服务器"
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {}
    }
  }
);

// 注册工具
server.tool("ping", "测试连接", () => {
  return {
    content: [{ type: "text", text: "pong" }]
  };
});

server.tool("create-item", "创建新项目", {
  name: z.string().describe("项目名称"),
  description: z.string().optional().describe("项目描述")
}, async (args) => {
  try {
    // 实际的创建逻辑
    const result = await createItem(args.name, args.description);
    
    return {
      content: [
        {
          type: "text",
          text: `成功创建项目: ${args.name}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `创建失败: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// 注册资源
server.resource("status", "app://status", async () => {
  return {
    contents: [
      {
        uri: "app://status",
        text: JSON.stringify({
          status: "运行中",
          timestamp: new Date().toISOString(),
          projectId: PROJECT_ID
        }, null, 2),
        mimeType: "application/json"
      }
    ]
  };
});

// 注册提示
server.prompt("help", "获取帮助信息", () => {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "请解释如何使用这个 MCP 服务器的功能。"
        }
      }
    ]
  };
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server 运行在 stdio");
}

main().catch((error) => {
  console.error("致命错误:", error);
  process.exit(1);
});

// 模拟的业务逻辑函数
async function createItem(name: string, description?: string) {
  // 实际的 API 调用或数据库操作
  return { id: "123", name, description };
}
```

## 最佳实践

### 1. 错误处理

```typescript
server.tool("safe-operation", "安全操作", async () => {
  try {
    const result = await riskyOperation();
    return {
      content: [
        {
          type: "text",
          text: `操作成功: ${result}`
        }
      ]
    };
  } catch (error) {
    console.error("操作失败:", error); // 记录到 stderr
    
    return {
      content: [
        {
          type: "text",
          text: `操作失败: ${error instanceof Error ? error.message : "未知错误"}`
        }
      ],
      isError: true
    };
  }
});
```

### 2. 输入验证

```typescript
const userSchema = {
  email: z.string().email("无效的邮箱地址"),
  age: z.number().min(0).max(150, "年龄必须在 0-150 之间"),
  name: z.string().min(1, "姓名不能为空").max(100, "姓名过长")
};

server.tool("create-user", "创建用户", userSchema, async (args) => {
  // args 已经通过 Zod 验证
  const user = await createUser(args);
  return {
    content: [
      {
        type: "text", 
        text: `用户创建成功: ${user.email}`
      }
    ]
  };
});
```

### 3. 日志记录

```typescript
// 使用 stderr 进行日志记录，避免干扰 MCP 协议
console.error("服务器启动时间:", new Date().toISOString());
console.error("环境变量加载完成");
console.error("数据库连接成功");
```

### 4. 资源缓存

```typescript
const cache = new Map<string, any>();

server.resource("cached-data", "app://data", async () => {
  const cacheKey = "project-data";
  
  if (cache.has(cacheKey)) {
    console.error("使用缓存数据");
    return cache.get(cacheKey);
  }
  
  console.error("获取新数据");
  const data = await fetchExpensiveData();
  
  const result = {
    contents: [
      {
        uri: "app://data",
        text: JSON.stringify(data, null, 2),
        mimeType: "application/json"
      }
    ]
  };
  
  cache.set(cacheKey, result);
  return result;
});
```

### 5. 动态功能管理

```typescript
// 根据配置启用/禁用功能
const toolConfig = {
  enableAdvancedFeatures: process.env.ENABLE_ADVANCED === "true",
  allowDangerousOperations: process.env.ALLOW_DANGEROUS === "true"
};

const advancedTool = server.tool("advanced-feature", "高级功能", () => {
  return { content: [{ type: "text", text: "高级功能结果" }] };
});

if (!toolConfig.enableAdvancedFeatures) {
  advancedTool.disable();
}
```

这份文档涵盖了 MCP Server SDK 的主要功能和用法。根据您的具体需求，您可以选择适合的模式来构建 MCP 服务器。