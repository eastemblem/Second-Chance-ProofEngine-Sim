import { z } from "zod";

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates UUID format
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

/**
 * UUID validation schema for Zod
 */
export const uuidSchema = z.string().regex(UUID_REGEX, "Invalid UUID format");

/**
 * Validates and parses request body with Zod schema
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return schema.parse(body);
}

/**
 * Safe validation that returns errors instead of throwing
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  uuid: uuidSchema,
  email: z.string().email("Invalid email address"),
  nonEmptyString: z.string().min(1, "Field is required"),
  optionalString: z.string().optional().transform(val => val === "" ? undefined : val),
  positiveNumber: z.number().positive("Must be a positive number"),
  sessionId: z.string().min(1, "Session ID is required")
};