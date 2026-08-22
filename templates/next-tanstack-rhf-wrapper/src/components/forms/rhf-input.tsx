import { FieldValues, Path, RegisterOptions, UseFormRegister } from "react-hook-form";
import { Input } from "../ui/input";

interface RHFInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<React.ComponentProps<typeof Input>, "name"> {
  name: Path<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
}

/*
We're using this for Uncontrolled components versions too
*/
const RHFInput = <TFieldValues extends FieldValues = FieldValues>({
  name,
  placeholder,
  register,
  ...props
}: RHFInputProps<TFieldValues>) => {
  return <Input {...register(name)} placeholder={placeholder} {...props} />;
};

export default RHFInput;