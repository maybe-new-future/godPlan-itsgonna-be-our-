import { z } from "zod";

export function validationError(error: z.ZodError) {
  return {
    message: "Validation failed",
    errors: error.flatten(),
  };
}
