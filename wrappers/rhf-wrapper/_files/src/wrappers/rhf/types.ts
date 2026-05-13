import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { z } from "zod";

export type ZodFormReturn<T extends z.ZodTypeAny> = UseFormReturn<z.infer<T>>;

export type FormValues<T extends FieldValues> = T;
