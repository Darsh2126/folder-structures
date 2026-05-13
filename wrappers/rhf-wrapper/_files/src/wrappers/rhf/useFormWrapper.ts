import { useForm, type UseFormProps, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

export function useZodForm<T extends z.ZodTypeAny>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, "resolver">
) {
  return useForm<z.infer<T>>({
    ...options,
    resolver: zodResolver(schema),
  });
}
