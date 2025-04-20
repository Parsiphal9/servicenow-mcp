import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { config } from "./config.ts";

// Configuration settings for ServiceNow instance

// config imported from config.ts
//export const config = {
//  username: "your_username",
//  password: "your_password",
//  instanceName: "your_instance_name",
//};

// 1. Server definition
const server = new McpServer({
  name: "servivenow-mcp",
  version: "0.1.0",
});

//2. Tools definition
server.tool(
  "read-record",
  "Tool that connects to a ServiceNow instance and retrieves a complete record by providing the table and field names and value of the field to search. This allows for targeted data retrieval from any ServiceNow table without complex queries.",
  {
    table: z.string().describe("Table name of the record to fetch"),
    field: z.string().describe("field of the table to fetch"),
    value: z.string().describe("Value of the field to fetch"),
  },
  async ({ field, table, value }) => {
    const response: ObjectResponse = await fetchRecord(
      config.instanceName,
      config.username,
      config.password,
      table,
      `${field}=${value}`,
    );

    if (response.result.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `Record with field ${field}=${value} not found in table ${table}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.result[0], null, 2),
        },
      ],
    };
  },
);

server.tool(
  "read-multiple-records",
  "This tool retrieves multiple records from a specified table based on a encoded query provided by the user. This tool should be used when the user wants to recover many records rather than a single record, allowing for efficient retrieval of data sets matching specific criteria.",
  {
    table: z.string().describe("The table to retrieve the record from"),
    query: z.string().describe("The servicenow encoded query to filter the records"),
    limit: z.string().describe("Optional variable to specify the maximum number of records to retrieve"),
  },

  async ({ table, query, limit }) => {
    const response: ObjectResponse = await fetchRecord(
      config.instanceName,
      config.username,
      config.password,
      table,
      query,
      limit || "1",
    );
    if (response.result.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No records found for query ${query} on table ${table}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.result, null, 2),
          //text: `Testing text for read-multiple-records for query ${query} on table ${table} and limit ${limit} is working`,
        },
      ],
    };
  },
);

server.tool(
  "update-record",
  "This tool updates a specific record in a ServiceNow table using the sys_id (unique identifier) and a JSON object containing the fields to be updated. It allows for targeted updates to any ServiceNow record without complex operations.",
  {
    sys_id: z.string().describe("sys_id of the record to update"),
    table: z.string().describe("Table name of the record to update"),
    fields: z.string().describe("JSON string containing the fields and values to update"),
  },
  async ({ sys_id, table, fields }) => {
    try {
      const fieldsObject = JSON.parse(fields);
      const response = await updateRecord(
        config.instanceName,
        config.username,
        config.password,
        table,
        sys_id,
        fieldsObject,
      );

      if (response.error) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating record: ${response.error}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Record successfully updated:\n${JSON.stringify(response.result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error processing update: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "create-record",
  "This tool creates a new record in a specified ServiceNow table using a JSON object containing the fields for the new record. It allows for the creation of new records in any ServiceNow table without complex operations.",
  {
    table: z.string().describe("Table name where the new record will be created"),
    fields: z.string().describe("JSON string containing the fields and values for the new record"),
  },
  async ({ table, fields }) => {
    try {
      const fieldsObject = JSON.parse(fields);
      const response = await createRecord(config.instanceName, config.username, config.password, table, fieldsObject);

      if (response.error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating record: ${response.error}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Record successfully created:\n${JSON.stringify(response.result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error processing creation: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
);

//3. Server - Transport - Listen communication through this transporter
const transport = new StdioServerTransport();
await server.connect(transport);

/**********************************************
 * Definition of logic                        *
 **********************************************/

// Define the return type for the fetch operation
type ObjectResponse = {
  result: any[];
  error?: string;
};

// Define the fetchRecord function with proper types
const fetchRecord = async (
  instance: string,
  username: string,
  password: string,
  table: string,
  query: string,
  setLimit?: string,
): Promise<ObjectResponse> => {
  const baseUrl = `https://${instance}.service-now.com/api/now/table/${table}`;
  const queryParams = new URLSearchParams({
    sysparm_query: query,
    sysparm_limit: setLimit ? setLimit : "",
  });

  // Encode credentials in base64
  const credentials = btoa(`${username}:${password}`);

  try {
    const response = await fetch(`${baseUrl}?${queryParams}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      //throw new Error(`HTTP error! status: ${response.status}`);
      return {
        result: [],
        error: `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Define the updateRecord function to handle PATCH requests
const updateRecord = async (
  instance: string,
  username: string,
  password: string,
  table: string,
  sysId: string,
  fieldsToUpdate: Record<string, any>,
): Promise<ObjectResponse> => {
  const baseUrl = `https://${instance}.service-now.com/api/now/table/${table}/${sysId}`;

  // Encode credentials in base64
  const credentials = btoa(`${username}:${password}`);

  try {
    const response = await fetch(baseUrl, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(fieldsToUpdate),
    });

    if (!response.ok) {
      return {
        result: [],
        error: `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      result: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// Define the createRecord function to handle POST requests
const createRecord = async (
  instance: string,
  username: string,
  password: string,
  table: string,
  fieldsToCreate: Record<string, any>,
): Promise<ObjectResponse> => {
  const baseUrl = `https://${instance}.service-now.com/api/now/table/${table}`;

  // Encode credentials in base64
  const credentials = btoa(`${username}:${password}`);

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(fieldsToCreate),
    });

    if (!response.ok) {
      return {
        result: [],
        error: `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      result: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
