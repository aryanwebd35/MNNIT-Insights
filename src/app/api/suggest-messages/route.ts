import OpenAI from 'openai'; // Importing the OpenAI SDK
import { OpenAIStream, StreamingTextResponse } from 'ai'; // For streaming OpenAI responses in Next.js
import { NextResponse } from 'next/server'; // Helper for server responses in Next.js API routes

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set the runtime to 'edge' to deploy this route as an Edge Function
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Prompt sent to the AI model to generate 3 conversation-starting questions
    const prompt = `
Create a list of three open-ended and engaging questions formatted as a single string.
Each question should be separated by '||'.

These questions are for an anonymous college feedback platform, where students can share
their honest opinions about various aspects of college life such as mess food, hostel facilities,
infrastructure, academics, and more.

Avoid personal or overly sensitive topics. Instead, focus on universal college-related themes 
that encourage thoughtful and constructive feedback.

For example, your output should be structured like this:
'What’s one thing you’d improve about your college mess?||How do you feel about the current hostel facilities?||What changes would make your campus environment more enjoyable?'.

Ensure the questions are engaging, spark meaningful responses, and contribute to a transparent 
and helpful feedback culture.
`;

    // Call to OpenAI using instruct-style model with streaming enabled
    const response = await openai.completions.create({
      model: 'gpt-3.5-turbo-instruct', // Uses the instruct variant for direct prompt handling
      max_tokens: 400,                 // Limit the response length
      stream: true,                    // Enable streaming responses
      prompt,                          // Provide the prompt text
    });

    // Convert OpenAI's stream into a web-readable stream
    const stream = OpenAIStream(response);

    // Return the stream as a StreamingTextResponse (client receives it in real-time)
    return new StreamingTextResponse(stream);
  } catch (error) {
    // If error is from the OpenAI API
    if (error instanceof OpenAI.APIError) {
      const { name, status, headers, message } = error;
      return NextResponse.json({ name, status, headers, message }, { status });
    } else {
      // For any unexpected error
      console.error('An unexpected error occurred:', error);
      throw error;
    }
  }
}

/*
==================================================
📚 Revisit Later – Theory + Flow Summary
==================================================

🧠 What This Does:
- This API route is used to generate **3 friendly, engaging questions** using the GPT model.
- Output format is a single string with `||` as a separator.

🧵 Streaming:
- This uses OpenAI’s **streaming API**, which returns data in chunks (good for UX).
- `OpenAIStream()` transforms OpenAI's stream into a readable stream.
- `StreamingTextResponse()` sends this stream to the frontend efficiently.

⚙️ Flow:
1. Route is deployed as an **Edge Function** for faster response.
2. When a POST request is sent, it sends a custom `prompt` to the `gpt-3.5-turbo-instruct` model.
3. The model streams back 3 formatted questions.
4. Stream is converted and returned using `StreamingTextResponse()`.

🛠️ Libraries Used:
- `openai`: For GPT calls
- `ai`: Vercel's helper for OpenAI streaming (`OpenAIStream`, `StreamingTextResponse`)
- `next/server`: For building Edge-compatible responses

📌 Notes:
- This is suitable for use in anonymous question generators, chatbot initializers, or icebreaker prompts.
- The `prompt` is pre-written and instructs GPT to output the questions in a specific format.
- Streaming provides a smoother frontend experience (e.g., words can appear one-by-one like ChatGPT).

✅ Ideal Use Case:
→ You call this route from your client (e.g. via `fetch` or `useChat` from `ai` package), and show the streamed text in a UI component.

==================================================
*/
