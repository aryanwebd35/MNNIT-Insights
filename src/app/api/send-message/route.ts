import UserModel from '@/model/User'; // Import the User model from the schema
import dbConnect from '@/lib/dbConnect'; // MongoDB connection utility
import { Message } from '@/model/User'; // Message type from the user schema

export async function POST(request: Request) {
   // Step 1: Connect to the MongoDB database
  await dbConnect();

   // Step 2: Extract data from the incoming request body
  const { username, content } = await request.json();

  try {
    const user = await UserModel.findOne({ username }).exec(); // Step 3: Find the user in the database using their username

    if (!user) {
      // Step 3.1: If user not found, respond with 404
      return Response.json(
        { message: 'User not found',
          success: false },
        { status: 404 }
      );
    }

    if (!user.isAcceptingMessages) {
      // Step 4: If user has disabled message reception, respond with 403
      return Response.json(
        { message: 'User is not accepting messages',
          success: false },
        { status: 403 }
      );
    }
    // Ye sab models ke andar hai
    const newMessage = {
      content,               // Message content from request
      createdAt: new Date(), // Timestamp for when the message is created
    };

    user.messages.push(newMessage as Message); // Step 5: Push the new message into the user's messages array
    await user.save(); // Step 6: Save the updated user document in MongoDB

    return Response.json(
      { message: 'Message sent successfully', 
        success: true }, // Step 7: Respond with success
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding message:', error); // Step 8: Log the error for debugging
    return Response.json(
      { message: 'Internal server error', success: false }, // Step 9: Respond with a 500 error
      { status: 500 }
    );
  }
}

/*
===============================
📚 Revisit Later – Theory + Flow Summary
===============================

🧠 What This Route Does:
- Handles POST requests to send anonymous messages to users.
- Takes in a username and message content.
- Checks if the user exists and is currently accepting messages.
- If all checks pass, appends the message to the user's messages array.

🔁 Flow:
1. Connect to the database.
2. Parse incoming request to get username & content.
3. Find the user by username.
4. If user doesn't exist → return 404.
5. If user is not accepting messages → return 403.
6. Create a message object with content and timestamp.
7. Push the message into user's `messages` array.
8. Save user document to DB.
9. Return a success or error response.

📦 Response Codes Used:
- ✅ 201 → Message created successfully
- 🚫 403 → User is not accepting messages
- ❓ 404 → User not found
- 💥 500 → Server error

🌱 Extra Ideas (optional features to add later):
- Add Zod validation for request body
- Add rate limiting per IP or user
- Add anonymous nickname for sender
- Use WebSocket or Pusher to notify the user in real-time

===============================
*/
