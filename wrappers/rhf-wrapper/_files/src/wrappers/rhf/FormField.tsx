import {
  useFormContext,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from "react-hook-form";

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  type?: string;
  placeholder?: string;
  rules?: RegisterOptions<T>;
}

export function FormField<T extends FieldValues>({
  name,
  label,
  type = "text",
  placeholder,
  rules,
}: FormFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name];

  return (
    <div>
      {label && <label htmlFor={name}>{label}</label>}
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name, rules)}
      />
      {error && <span>{String(error.message ?? "Invalid field")}</span>}
    </div>
  );
}
