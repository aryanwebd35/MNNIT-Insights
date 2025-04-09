// Import the MongoDB connection utility
import dbConnect from '@/lib/dbConnect';
// Import the User model from Mongoose schema
import UserModel from '@/model/User';

// Async POST handler to verify a user's account using a code
export async function POST(request: Request) {
  // Connect to the database
  await dbConnect();

  try {
    // Extract JSON body from the incoming request
    const { username, code } = await request.json();

    // Decode the username in case it was URL-encoded (e.g., "john%20doe" → "john doe")
    const decodedUsername = decodeURIComponent(username);

    // Find the user in the database using the decoded username
    const user = await UserModel.findOne({ username: decodedUsername });

    // If no user found, return 404 Not Found
    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the submitted verification code matches the stored code
    const isCodeValid = user.verifyCode === code;

    // Check if the verification code has not expired (expiry time > current time)
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();

    // If both code is correct AND it's not expired, then proceed to verify the user
    if (isCodeValid && isCodeNotExpired) {
      // Set the user's verification status to true
      user.isVerified = true;

      // Save the updated user document back to the database
      await user.save();

      // Respond with success if everything went fine
      return Response.json(
        { success: true,
          message: 'Account verified successfully' },
        { status: 200 }
      );
    } 
    // If the code has expired (even if correct), prompt user to re-register
    else if (!isCodeNotExpired) {
      return Response.json(
        {
          success: false,
          message:
            'Verification code has expired. Please sign up again to get a new code.',
        },
        { status: 400 } // Bad request due to expiration
      );
    } 
    // If the code is just wrong (but not expired), return an error
    else {
      return Response.json(
        { success: false, message: 'Incorrect verification code' },
        { status: 400 } // Bad request due to invalid input
      );
    }
  } catch (error) {
    // Catch any unexpected errors (e.g., JSON parsing, DB issues) and log for debugging
    console.error('Error verifying user:', error);

    // Return a generic internal server error message
    return Response.json(
      { success: false, message: 'Error verifying user' },
      { status: 500 }
    );
  }
}

/**
 * ─── REVISE LATER (THEORY + FLOW + EXTRAS) ─────────────────────────────────────
 * 
 * 📌 THEORY:
 * - This API route is used to verify a user's email/account using a one-time code.
 * - The code and username are sent via POST in JSON format.
 * - The route checks:
 *    1. If the user exists
 *    2. If the verification code matches
 *    3. If the code has not expired
 * - If all conditions pass, the user is marked as verified.
 * 
 * 🔁 FLOW:
 * 1. Connect to MongoDB.
 * 2. Extract `username` and `code` from request body.
 * 3. Decode the username in case it has URL encoding.
 * 4. Find the user with the given username.
 * 5. If not found → return 404.
 * 6. If found → check if code matches and is not expired.
 *    - If yes → set `isVerified = true` and save.
 *    - If code expired → ask to re-register.
 *    - If code is wrong → return error message.
 * 7. Catch any unexpected errors and return 500.
 * 
 * ✅ REMINDERS:
 * - Add rate-limiting to avoid brute-force on code.
 * - Make code comparison time-safe to prevent timing attacks.
 * - Make sure the `verifyCodeExpiry` is stored as ISO date in DB.
 * - Consider clearing `verifyCode` and `verifyCodeExpiry` after verification.
 * - Frontend should redirect users appropriately on each type of response.
 * 
 */
