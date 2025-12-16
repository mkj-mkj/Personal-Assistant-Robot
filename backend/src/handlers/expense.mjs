import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ExpenseTable";

export const handler = async (event) => {
    // Support both HTTP API (v2) and REST API (v1) event structure
    const method = event.requestContext?.http?.method || event.httpMethod;

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (method === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    try {
        if (method === "GET") {
            // List expenses filtered by userId
            const userId = event.queryStringParameters?.userId;

            let command;
            if (userId) {
                command = new ScanCommand({
                    TableName: TABLE_NAME,
                    FilterExpression: "userId = :uid",
                    ExpressionAttributeValues: {
                        ":uid": userId
                    }
                });
            } else {
                // Fallback for backward compatibility or admin view
                command = new ScanCommand({ TableName: TABLE_NAME });
            }

            const response = await docClient.send(command);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(response.Items || [])
            };
        }

        if (method === "POST") {
            // Add Expense
            const body = JSON.parse(event.body);

            if (!body.userId) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing userId" }) };
            }

            const newItem = {
                id: Date.now().toString(), // Simple ID generation
                ...body,
                createdAt: new Date().toISOString()
            };

            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: newItem
            });

            await docClient.send(command);
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(newItem)
            };
        }

        if (method === "DELETE") {
            // Delete Expense
            // Assumes path parameter /expense/{id} is not easily available in simple setup, 
            // so we'll take ID from query string or body for simplicity in this demo.
            const id = event.queryStringParameters?.id;

            if (!id) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id" }) };
            }

            const command = new DeleteCommand({
                TableName: TABLE_NAME,
                Key: { id: id }
            });

            await docClient.send(command);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: "Deleted" })
            };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
