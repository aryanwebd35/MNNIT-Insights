// Import utility to connect to MongoDB
import dbConnect from '@/lib/dbConnect';
// Import Mongoose User model
import UserModel from '@/model/User';
// Import Zod for schema validation
import { z } from 'zod';
// Import username validation rule from signup schema
import { usernameValidation } from '@/schemas/signUpSchema';

// Define a Zod schema for validating query params (only `username` is expected)
const UsernameQuerySchema = z.object({
  username: usernameValidation, // Reuses existing validation rule
});

// Exporting an async GET handler function to check username availability
export async function GET(request: Request) {
  // Ensure database connection is established before proceeding
  await dbConnect();

  try {
    // Parse the URL and extract query parameters .
    //  Aur bhi paramenter ho sakte h
    const { searchParams } = new URL(request.url);

    // Get the 'username' query param from the URL
    const queryParams = {
      username: searchParams.get('username'), // May return null if not present
    };

    // Validate the query parameters using Zod schema
    // safeParse -> agar schema sahi hoga toh pass
    const result = UsernameQuerySchema.safeParse(queryParams);

    // If validation fails, return a 400 Bad Request with error message
    if (!result.success) {
      // Extract specific error messages for the 'username' field, if any
      //result.error.format() -> Isme saare error hote h but we want usnername ka error

      const usernameErrors = result.error.format()
      .username?._errors || [];

      // Return validation error(s) or fallback message

      
      return Response.json(
        {
          success: false,
          message:
          
            usernameErrors?.length > 0
              ? usernameErrors.join(', ') // Display detailed validation errors
              : 'Invalid query parameters', // Generic fallback error
        },
        { status: 400 } // Bad request
      );
    }

    // Destructure the validated data from result
    // console.log(result) = .data
    const { username } = result.data;

    // Look for a user in the "database" with the same username and verified status
    const existingVerifiedUser = await UserModel.findOne({
      username,
      isVerified: true, // Only check for verified users
    });

    // If user exists and is verified, respond that username is taken
    if (existingVerifiedUser) {
      return Response.json(
        {
          success: false,
          message: 'Username is already taken', // User exists with this username
        },
        { status: 200 } // 200 OK, because the request itself is valid
      );
    }

    // If no such user is found, return success (username is available)
    return Response.json(
      {
        success: true,
        message: 'Username is unique', // Good to go!
      },
      { status: 200 } // 200 OK
    );
  } catch (error) {
    // Log error for debugging
    console.error('Error checking username:', error);

    // Return internal server error
    return Response.json(
      {
        success: false,
        message: 'Error checking username', // Something went wrong
      },
      { status: 500 } // Internal server error
    );
  }
}

/**
 * ─── REVISE LATER (THEORY + FLOW + EXTRAS) ─────────────────────────────────────
 * 
 * 📌 THEORY:
 * - This is a Next.js API route using the App Router (`GET` handler function).
 * - It uses Zod for input validation, and Mongoose for MongoDB querying.
 * - The purpose is to check if a username is available before signup.
 * - Only checks for users where `isVerified = true` (to avoid blocking taken-but-unverified usernames).
 * 
 * 🔁 FLOW:
 * 1. Connect to MongoDB.
 * 2. Extract the `username` from the request's query string.
 * 3. Validate the `username` using Zod schema (which might include regex, length, etc.).
 * 4. If invalid → return 400 with a message.
 * 5. If valid → search MongoDB for a verified user with the same username.
 * 6. If found → return "Username is taken".
 * 7. If not found → return "Username is unique".
 * 8. If anything crashes → return 500 Internal Server Error.
 * 
 * ✅ REMINDERS:
 * - Add caching for common checks if this gets spammed.
 * - Make sure the `username` field is indexed in MongoDB.
 * - Sanitize + lowercase usernames if case-insensitive.
 * - Write tests to check edge cases (missing username, bad format, etc.).
 * - Add rate-limiting logic (e.g., via middleware or Next.js edge).
 * 
 */
