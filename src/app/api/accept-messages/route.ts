// Import session utility to get user data securely from NextAuth
import { getServerSession } from 'next-auth/next';
// Auth options used by NextAuth (for session retrieval)
import { authOptions } from '../auth/[...nextauth]/options';
// Import the database connection utility
import dbConnect from '@/lib/dbConnect';
// Import the User model (Mongoose schema)
import UserModel from '@/model/User';
// Import NextAuth's User type for better type safety
import { User } from 'next-auth';

export async function POST(request: Request) {
  // Connect to the MongoDB database
  await dbConnect();

  // Get the currently authenticated session (server-side)
  // getServerSession -> to get currently logged-in user . It requires authOptions 
  const session = await getServerSession(authOptions);

  // Extract user object from session (Options)
  const user: User = session?.user;

  // If user is not authenticated, return 401 Unauthorized
  if (!session || !session.user) {
    return Response.json(
      { success: false,
        message: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Extract the user ID from the session
  const userId = user._id;

  // Get the new value of acceptMessages from the request body
  const { acceptMessages } = await request.json();

  try {
    // Find the user by ID and update their message preference
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isAcceptingMessages: acceptMessages }, // new value
      { new: true } // return the updated document
    );

    // If user not found, respond with 404
    if (!updatedUser) {
      return Response.json(
        {
          success: false,
          message: 'Unable to find user to update message acceptance status',
        },
        { status: 404 }
      );
    }

    // Success: return confirmation and the updated user
    return Response.json(
      {
        success: true,
        message: 'Message acceptance status updated successfully',
        updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    // Log and respond to server-side errors
    console.error('Error updating message acceptance status:', error);
    return Response.json(
      { success: false, message: 'Error updating message acceptance status' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // Connect to the MongoDB database
  await dbConnect();

  // Get the authenticated session
  const session = await getServerSession(authOptions);
  const user = session?.user;

  // If not authenticated, return 401 Unauthorized
  if (!session || !user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // Find the user by ID to retrieve their message preference
    const foundUser = await UserModel.findById(user._id);

    // If no user found, return 404
    if (!foundUser) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Return user's message acceptance status (true or false)
    return Response.json(
      {
        success: true,
        isAcceptingMessages: foundUser.isAcceptingMessages,
      },
      { status: 200 }
    );
  } catch (error) {
    // Log and handle server-side errors
    console.error('Error retrieving message acceptance status:', error);
    return Response.json(
      { success: false,
        message: 'Error retrieving message acceptance status' },
      { status: 500 }
    );
  }
}

/**
 * ─── REVISE LATER (THEORY + FLOW + EXTRAS) ─────────────────────────────────────
 * 
 * 📌 THEORY:
 * - These handlers manage a user's "message preference" setting.
 * - The POST request updates the value (`isAcceptingMessages`) in the DB.
 * - The GET request reads and returns the current status.
 * - Both routes are protected: only logged-in users can access them (via NextAuth).
 * 
 * 🔁 FLOW:
 * ✅ POST:
 * 1. Connect to DB.
 * 2. Get server session using NextAuth.
 * 3. Ensure user is authenticated.
 * 4. Parse `acceptMessages` from request body.
 * 5. Find user by ID and update their setting.
 * 6. Return updated user or appropriate error.
 * 
 * ✅ GET:
 * 1. Connect to DB.
 * 2. Get user session.
 * 3. Validate session.
 * 4. Find user by ID.
 * 5. Return `isAcceptingMessages` or 404 error.
 * 
 * 🧠 TIPS TO IMPROVE:
 * - Create a shared `requireAuth` utility to avoid repeating session logic.
 * - Add frontend toggle switch that syncs with this endpoint.
 * - Consider using PATCH instead of POST for partial updates like this.
 * - Add test cases: unauthenticated user, user not found, invalid input.
 * - Rate-limit the POST route to prevent spam toggling.
 * - Validate the incoming `acceptMessages` value (must be boolean).
 * 
 */
