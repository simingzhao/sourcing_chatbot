import { z } from "zod";

// User message types
export const UserMessageSchema = z.object({
  type: z.literal("user"),
  content: z.string(),
  images: z.array(z.string()).nullable(), // Base64 encoded images
  files: z.array(z.object({
    name: z.string(),
    content: z.string(),
    type: z.enum(["txt", "csv"])
  })).nullable()
});

// Bot response types
export const TextResponseSchema = z.object({
  type: z.literal("text"),
  content: z.string()
});

export const PillResponseSchema = z.object({
  type: z.literal("pills"),
  content: z.string(),
  pills: z.array(z.string()),
  pillsActive: z.boolean().optional().default(true)
});

export const CardResponseSchema = z.object({
  type: z.literal("card"),
  content: z.string(),
  card: z.object({
    summary: z.array(z.string()), // Bullet points
    attachments: z.array(z.object({
      url: z.string(),
      type: z.enum(["image", "file"]),
      name: z.string().nullable()
    })).nullable()
  }),
  pills: z.array(z.enum(["Edit", "Submit"])),
  pillsActive: z.boolean().optional().default(true)
});

// Union type for all bot responses
export const BotResponseSchema = z.discriminatedUnion("type", [
  TextResponseSchema,
  PillResponseSchema,
  CardResponseSchema
]);

// Conversation message type
export const ConversationMessageSchema = z.union([
  UserMessageSchema.extend({ role: z.literal("user") }),
  BotResponseSchema.extend({ role: z.literal("assistant") })
]);

// Export TypeScript types
export type UserMessage = z.infer<typeof UserMessageSchema>;
export type TextResponse = z.infer<typeof TextResponseSchema>;
export type PillResponse = z.infer<typeof PillResponseSchema>;
export type CardResponse = z.infer<typeof CardResponseSchema>;
export type BotResponse = z.infer<typeof BotResponseSchema>;
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

// Conversation state type
export interface ConversationState {
  id: string;
  messages: ConversationMessage[];
  context: {
    stage: "initial" | "collecting" | "summarizing" | "editing";
    collectedInfo: {
      product?: string;
      quantity?: string;
      customization?: string[];
      leadTime?: string;
      incoterms?: string;
      shipping?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}