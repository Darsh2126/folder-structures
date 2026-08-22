import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export interface SelectOption {
  label: string;
  value: string;
}

interface RHFSelectProps<TFieldValues extends FieldValues = FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

/*
We're using this for Controlled components only
*/
const RHFSelect = <TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  options,
  placeholder = "Select an option",
  disabled,
  children,
}: RHFSelectProps<TFieldValues>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          value={field.value ?? ""}
          onValueChange={(val) => field.onChange(val)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {children
              ? children
              : options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
    />
  );
};

export default RHFSelect;