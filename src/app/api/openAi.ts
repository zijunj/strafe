import axios from "axios";

// Define the message type manually
export interface ChatCompletionRequestMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const openai = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
});

interface OpenAIChatResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export const askOpenAI = async (
  messages: ChatCompletionRequestMessage[]
): Promise<string> => {
  try {
    const response = await openai.post<OpenAIChatResponse>("/chat/completions", {
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 150,
    });

    return response.data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error("OpenAI API Error:", error.message);
    return "Sorry, I couldn’t process that request.";
  }
};
