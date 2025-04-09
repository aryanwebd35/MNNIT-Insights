// Connect to MongoDB
import dbConnect from '@/lib/dbConnect';
// Mongoose user model
import UserModel from '@/model/User';
// For creating ObjectId from string
import mongoose from 'mongoose';
// Type from NextAuth (for session user)
import { User } from 'next-auth';
// Get server session to identify user
import { getServerSession } from 'next-auth/next';
// NextAuth configuration
import { authOptions } from '../auth/[...nextauth]/options';

export async function GET(request: Request) {
  // Connect to the database
  await dbConnect();

  // Get the user session
  // In NextAuth.js, a session is an object that represents the currently logged-in user.
  const session = await getServerSession(authOptions);

  // Extract the user object from 0
  const _user: User = session?.user;

  // If user is not authenticated, return 401
  if (!session || !_user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Convert the user ID string into a MongoDB ObjectId
  const userId = new mongoose.Types.ObjectId(_user._id);

  try {
    // In MongoDB, the Aggregation Pipeline is a powerful framework for transforming, filtering, and analyzing data.
    // Aggregation pipeline to fetch and sort user's messages
    const user = await UserModel.aggregate([
      { $match: { _id: userId } },                  // Step 1: Match the user by ID
      { $unwind: '$messages' },                     // Step 2: Flatten the messages array (one message per document)
      { $sort: { 'messages.createdAt': -1 } },      // Step 3: Sort messages by creation date (most recent first)
      { $group: { _id: '$_id', messages: { $push: '$messages' } } }, // Step 4: Re-group all messages into an array
    ]).exec();

    // If no user found or no messages
    if (!user || user.length === 0) {
      return Response.json(
        { message: 'User not found',
          success: false },
        { status: 404 }
      );
    }

    // Success: return sorted messages
    return Response.json(
      { messages: user[0].messages },
      {
        status: 200,
      }
    );
  } catch (error) {
    // Catch any unexpected errors and log
    console.error('An unexpected error occurred:', error);
    return Response.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

/**
 * ─── REVISE LATER (THEORY + FLOW + EXTRAS) ─────────────────────────────────────
 * 
 * 📌 THEORY:
 * - This endpoint fetches the authenticated user's messages, sorted by newest first.
 * - It uses a MongoDB Aggregation Pipeline to efficiently transform and retrieve data.
 * - Aggregation steps used:
 *    1. `$match`: Find the user by ID.
 *    2. `$unwind`: Break apart the `messages` array so we can sort individual messages.
 *    3. `$sort`: Sort all messages in descending order of `createdAt`.
 *    4. `$group`: Re-group messages under the user after sorting.
 * 
 * 🔁 FLOW:
 * 1. Connect to DB.
 * 2. Get server session to find the logged-in user.
 * 3. Convert user ID to ObjectId (required for aggregation match).
 * 4. Run aggregation pipeline to extract and sort messages.
 * 5. If user not found → return 404.
 * 6. If found → return sorted messages in response.
 * 
 * 🧠 TIPS TO IMPROVE:
 * - Add pagination to avoid sending large message arrays (e.g., `$skip` + `$limit`).
 * - Move the aggregation logic to a model method (`UserModel.getSortedMessagesById()`).
 * - Add projection to exclude unnecessary fields.
 * - Add caching for frequent requests (Redis or edge cache).
 * - Add Zod validation if request includes params (e.g., pagination).
 * - Consider a fallback if `createdAt` is missing on older messages.
 * 
 */
