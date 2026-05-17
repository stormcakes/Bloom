import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { buildBloomSystemPrompt } from "@/lib/prompts/system-prompt";

export const maxDuration = 30;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, session_id } = await request.json();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const systemPrompt = buildBloomSystemPrompt(profile ?? {});

  if (session_id && messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user") {
      await supabase.from("chat_messages").insert({
        session_id,
        user_id: user.id,
        role: "user",
        content: lastMessage.content,
      });
    }
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages,
    maxTokens: 600,
    async onFinish({ text }) {
      if (session_id) {
        await supabase.from("chat_messages").insert({
          session_id,
          user_id: user.id,
          role: "assistant",
          content: text,
        });
      }
    },
  });

  return result.toDataStreamResponse();
}
