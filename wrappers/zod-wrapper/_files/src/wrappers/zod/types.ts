import type { z } from "zod";

export type ZodInfer<T extends z.ZodTypeAny> = z.infer<T>;

export type ZodInput<T extends z.ZodTypeAny> = z.input<T>;

export type ZodOutput<T extends z.ZodTypeAny> = z.output<T>;
