## Wire it up

1. Use the typed form hook in your module:
   ```tsx
   import { useZodForm, FormField } from "@/wrappers/rhf";
   import { z } from "zod";

   const loginSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
   });

   function LoginForm() {
     const form = useZodForm(loginSchema);
     const { handleSubmit, FormProvider } = form;

     return (
       <FormProvider {...form}>
         <form onSubmit={handleSubmit((data) => console.log(data))}>
           <FormField name="email" label="Email" type="email" />
           <FormField name="password" label="Password" type="password" />
           <button type="submit">Submit</button>
         </form>
       </FormProvider>
     );
   }
   ```

## What's inside
- useFormWrapper.ts → typed `useZodForm` hook with zodResolver pre-configured
- FormField.tsx     → controlled input wrapper with error display
- types.ts          → helper types
- index.ts          → barrel export
