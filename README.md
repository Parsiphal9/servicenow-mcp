# ServiceNow MCP

A Model Context Protocol (MCP) connector for ServiceNow that enables AI assistants to interact with ServiceNow instances through a standardized protocol.

## Overview

This project implements a server that follows the Model Context Protocol (MCP) to provide AI assistants with the ability to perform CRUD operations on ServiceNow instances. It enables AI systems to read, create, and update records in ServiceNow tables without needing direct API access.

## Features

- **Read Records**: Retrieve individual records from any ServiceNow table by specifying table name and field criteria
- **Read Multiple Records**: Query multiple records using ServiceNow's encoded query syntax
- **Update Records**: Modify existing records in ServiceNow tables
- **Create Records**: Add new records to ServiceNow tables

## Prerequisites

- Node.js (v16 or higher) or Bun runtime
- ServiceNow instance with API access
- API credentials (username and password)

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd servicenow-mcp
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure your ServiceNow credentials:
   Create a `config.ts` file in the project root with the following content:
   ```typescript
   export const config = {
     username: "your_servicenow_username",
     password: "your_servicenow_password",
     instanceName: "your_instance_name", // e.g., "dev12345"
   };
   ```

## Usage

### Starting the MCP Server from MCP config file

Add this json format entry to your MCP config file

```json
"servicenow-mcp":{
  "command":"npx",
  "args":[
    "-y",
    "tsx",
    "path-to-folder/servicenow-mcp/index.ts"
  ]
}
```

### Starting the MCP Server manually

Using npx:

```bash
npx tsx index.ts
```

Using Node.js:

```bash
pnpm start
```

Using Bun:

```bash
pnpm start-bun
```

### Debugging with inspector

```bash
npx -y @modelcontextprotocol/inspector npx -y tsx index.ts
```

### Available Tools

The server exposes the following tools:

#### read-record

Retrieves a single record from a ServiceNow table based on a field match.

```json
{
  "table": "incident",
  "field": "number",
  "value": "INC0010001"
}
```

#### read-multiple-records

Retrieves multiple records from a ServiceNow table based on an encoded query.

```json
{
  "table": "incident",
  "query": "active=true^priority=1",
  "limit": "10"
}
```

#### update-record

Updates an existing record in a ServiceNow table.

```json
{
  "sys_id": "a1b2c3d4e5f6g7h8i9j0",
  "table": "incident",
  "fields": "{\"state\": \"2\", \"priority\": \"1\"}"
}
```

#### create-record

Creates a new record in a ServiceNow table.

```json
{
  "table": "incident",
  "fields": "{\"short_description\": \"Test incident\", \"caller_id\": \"a1b2c3d4e5f6g7h8i9j0\"}"
}
```

## Security Considerations

- Store your ServiceNow credentials securely and do not commit them to source control
- Consider using environment variables or a secrets manager for production
- The MCP server can be integrated with authentication mechanisms for secure communication

## License

ISC

## Author

Mixcoatl Deyta
