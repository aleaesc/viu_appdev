const { z } = require('zod');

// Survey DTO: adjust fields to match your frontend form names if needed
const SurveyDTO = z.object({
  // Example fields; backend won't change frontend, but validates generically
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  responses: z.record(z.any()).optional(),
  createdAt: z.number().optional()
}).strict();

// Admin response DTO
const AdminListQueryDTO = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50)
}).strict();

function validateDTO(schema, data) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
    const error = new Error('Validation failed');
    error.status = 400;
    error.details = issues;
    throw error;
  }
  return parsed.data;
}

module.exports = { SurveyDTO, AdminListQueryDTO, validateDTO };
