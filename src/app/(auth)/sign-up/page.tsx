'use client'; // Enables client-side rendering for this component

// Importing necessary types and utilities
import { ApiResponse } from '@/types/ApiResponse';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDebounce } from 'usehooks-ts';
import * as z from 'zod';

// Importing UI components and utilities
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import axios, { AxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signUpSchema } from '@/schemas/signUpSchema';

export default function SignUpForm() {
  const [username, setUsername] = useState(''); // Stores entered username
  const [usernameMessage, setUsernameMessage] = useState(''); // Message shown after username check
  const [isCheckingUsername, setIsCheckingUsername] = useState(false); // Flag for loading spinner during username check
  const [isSubmitting, setIsSubmitting] = useState(false); // Flag to disable submit button while form submits
  const debouncedUsername = useDebounce(username, 300); // Prevents calling API on every keystroke (adds 300ms debounce)

  const router = useRouter(); // For navigation
  const { toast } = useToast(); // For showing notifications

  // Initialize form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  // Side effect to check if username is unique
  useEffect(() => {
    const checkUsernameUnique = async () => {
      if (debouncedUsername) {
        setIsCheckingUsername(true); // Show loading
        setUsernameMessage(''); // Reset message before new request
        try {
          // Make API request to check uniqueness
          const response = await axios.get<ApiResponse>(
            `/api/check-username-unique?username=${debouncedUsername}`
          );
          setUsernameMessage(response.data.message); // Set result message
        } catch (error) {
          const axiosError = error as AxiosError<ApiResponse>;
          setUsernameMessage(
            axiosError.response?.data.message ?? 'Error checking username'
          );
        } finally {
          setIsCheckingUsername(false); // Hide loading spinner
        }
      }
    };
    checkUsernameUnique(); // Call function whenever debouncedUsername changes
  }, [debouncedUsername]);

  // Submit form handler
  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true); // Disable button and show spinner
    try {
      const response = await axios.post<ApiResponse>('/api/sign-up', data); // Send signup data to backend

      // Show success toast
      toast({
        title: 'Success',
        description: response.data.message,
      });

      // Navigate to verify page
      router.replace(`/verify/${username}`);

      setIsSubmitting(false);
    } catch (error) {
      console.error('Error during sign-up:', error);
      const axiosError = error as AxiosError<ApiResponse>;

      // Default error message
      let errorMessage =
        axiosError.response?.data.message ??
        'There was a problem with your sign-up. Please try again.';

      toast({
        title: 'Sign Up Failed',
        description: errorMessage,
        variant: 'destructive', // Red styling for error
      });

      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
            Join True Feedback
          </h1>
          <p className="mb-4">Sign up to start your anonymous adventure</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Username Field */}
            <FormField
              name="username"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e); // Update form state
                      setUsername(e.target.value); // Update local state for debounce
                    }}
                  />
                  {/* Show loading or result message */}
                  {isCheckingUsername && <Loader2 className="animate-spin" />}
                  {!isCheckingUsername && usernameMessage && (
                    <p
                      className={`text-sm ${
                        usernameMessage === 'Username is unique'
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {usernameMessage}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Email Field */}
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Input {...field} name="email" />
                  <p className="text-muted text-gray-400 text-sm">
                    We will send you a verification code
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Password Field */}
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <Input type="password" {...field} name="password" />
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        </Form>
        {/* Redirect to Sign In */}
        <div className="text-center mt-4">
          <p>
            Already a member?{' '}
            <Link href="/sign-in" className="text-blue-600 hover:text-blue-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------
   🧠 Revisit Later – Theory + Flow Summary
----------------------------------- */

// ✅ This component handles user sign-up using form validation, username uniqueness check, and API submission.

// 1. Form state is managed using `react-hook-form` with Zod validation schema.
// 2. Username is checked on-the-fly (debounced 300ms) using axios to hit an API endpoint.
// 3. On successful form submit, it sends user data to backend and redirects to verification page.
// 4. Uses `useToast` from shadcn/ui for showing user-friendly success or error messages.
// 5. Loading spinners improve UX during form submission or API checks.
// 6. Component is wrapped in `'use client'` directive to run in the browser environment.
// 7. UI components are from `shadcn/ui` styled with Tailwind CSS classes.
// 8. API expects a consistent `ApiResponse` structure for handling frontend feedback.
