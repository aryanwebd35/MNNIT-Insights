'use client'; // This makes the component run on the client side (required for hooks like useForm)

// Import dependencies and components
import { zodResolver } from '@hookform/resolvers/zod'; // Integrates Zod with React Hook Form
import { useForm } from 'react-hook-form'; // Hook-based form management
import * as z from 'zod'; // Zod for schema validation
import { signIn } from 'next-auth/react'; // Auth function from NextAuth.js
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'; // Custom form components from shadcn/ui
import { Button } from '@/components/ui/button'; // Styled button component
import { Input } from '@/components/ui/input'; // Styled input component
import Link from 'next/link'; // Link for navigation
import { useRouter } from 'next/navigation'; // Router to redirect user
import { useToast } from '@/components/ui/use-toast'; // Custom toast hook
import { signInSchema } from '@/schemas/signInSchema'; // Zod schema for validation

export default function SignInForm() {
  const router = useRouter(); // For navigating after login

  // Initialize form with default values and Zod validation
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: '', // Can be username or email
      password: '',
    },
  });

  const { toast } = useToast(); // Toast for user feedback

  // Submit handler for form
  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    // Attempt to sign in using NextAuth credentials provider
    const result = await signIn('credentials', {
      redirect: false,
      identifier: data.identifier,
      password: data.password,
    });

    // Handle errors from sign-in attempt
    if (result?.error) {
      if (result.error === 'CredentialsSignin') {
        // Invalid credentials
        toast({
          title: 'Login Failed',
          description: 'Incorrect username or password',
          variant: 'destructive',
        });
      } else {
        // Any other error
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    }

    // If sign-in successful, redirect to dashboard
    if (result?.url) {
      router.replace('/dashboard');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        {/* Header section */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
            Welcome Back to True Feedback
          </h1>
          <p className="mb-4">Sign in to continue your secret conversations</p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email/Username field */}
            <FormField
              name="identifier"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email/Username</FormLabel>
                  <Input {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Password field */}
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <Input type="password" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Submit button */}
            <Button className='w-full' type="submit">Sign In</Button>
          </form>
        </Form>

        {/* Link to sign-up page */}
        <div className="text-center mt-4">
          <p>
            Not a member yet?{' '}
            <Link href="/sign-up" className="text-blue-600 hover:text-blue-800">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

//
// Revisit Later – Theory + Flow Summary 🧠
//
// ✅ This is a sign-in component for the app True Feedback.
// ✅ Uses react-hook-form + Zod to validate email/username and password fields.
// ✅ Submits the form using NextAuth's `signIn()` method (credentials provider).
// ✅ If credentials are invalid, it shows appropriate toast feedback.
// ✅ If successful, user is redirected to the dashboard.
//
// 🔁 Flow:
// 1. User lands on `/sign-in`
// 2. Enters email/username and password
// 3. Form is validated → sent to NextAuth
// 4. If success → Redirect to dashboard
// 5. If failure → Show error toast
//
