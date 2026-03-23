// Define the message type manually
export interface ChatCompletionRequestMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const askOpenAI = async (
  messages: ChatCompletionRequestMessage[]
): Promise<string> => {
  try {
    const res = await fetch("/api/openai", {
      method: "POST",
      body: JSON.stringify({ messages }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error("OpenAI API Error:", error.message);
    return "Sorry, I couldn’t process that request.";
  }
};
