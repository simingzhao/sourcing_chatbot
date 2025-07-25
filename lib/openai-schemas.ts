import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

// Define the schemas for OpenAI Structured Output
export const TextOnlySchema = z.object({
  type: z.literal("text"),
  content: z.string().describe("The chatbot's response text")
});

export const TextWithPillsSchema = z.object({
  type: z.literal("pills"),
  content: z.string().describe("The main message to display"),
  pills: z.array(z.string()).describe("Clickable options for the user")
});

export const SummaryCardSchema = z.object({
  type: z.literal("card"),
  content: z.string().describe("Brief message before the card"),
  card: z.object({
    summary: z.array(z.string()).describe("Bullet points of collected requirements"),
    attachments: z.array(z.object({
      url: z.string().describe("URL or reference to the attachment"),
      type: z.enum(["image", "file"]).describe("Type of attachment"),
      name: z.string().nullable().describe("Name of the file")
    })).nullable().describe("User-provided attachments")
  }).describe("The requirement summary card"),
  pills: z.array(z.enum(["Edit", "Submit"])).describe("Action buttons - always include both Edit and Submit")
});

// Union schema for all response types
const ChatResponseUnion = z.discriminatedUnion("type", [
  TextOnlySchema,
  TextWithPillsSchema,
  SummaryCardSchema
]);

// Wrap the union in an object as required by OpenAI
export const ChatResponseSchema = z.object({
  response: ChatResponseUnion
});

// Create the response format for OpenAI
export const chatResponseFormat = zodResponseFormat(ChatResponseSchema, "chat_response");

// Helper function to determine response stage
export function determineResponseStage(content: string): "assessing" | "collecting" | "summarizing" {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("edit") || lowerContent.includes("submit")) {
    return "summarizing";
  } else if (lowerContent.includes("tell me more") || lowerContent.includes("what kind of")) {
    return "assessing";
  } else {
    return "collecting";
  }
}