'use client'
import RHFInput from "@/components/forms/rhf-input";
import RHFSelect from "@/components/forms/rhf-select";
import { FormProvider, useForm } from "react-hook-form";


const FormPage = () => {
  const methods = useForm({
    defaultValues: {
      name: "",
      role: "",
    },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => console.log(data))}>
        <RHFInput name="name" placeholder="Enter name" register={methods.register} />
        <RHFSelect
          control={methods.control}
          name="role"
          placeholder="Select role"
          options={[
            { label: "Admin", value: "admin" },
            { label: "User", value: "user" },
          ]}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
};

export default FormPage