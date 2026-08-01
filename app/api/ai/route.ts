import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/supabase/server";

const anthropic = new Anthropic();

type Message = { role: "user" | "assistant"; content: string };

interface StoreWithProducts {
  name: string;
  name_ar: string | null;
  ai_personality: string | null;
  products: Array<{
    name: string;
    name_ar: string | null;
    price: number;
    stock: number;
    is_active: boolean;
  }>;
}

export async function POST(request: Request) {
  try {
    const {
      message,
      storeId,
      history = [],
    }: { message: string; storeId: string; history: Message[] } =
      await request.json();

    if (!message || !storeId) {
      return Response.json(
        { error: "Missing message or storeId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data } = await supabase
      .from("stores")
      .select("name, name_ar, ai_personality, products(name, name_ar, price, stock, is_active)")
      .eq("id", storeId)
      .eq("is_active", true)
      .single();

    if (!data) {
      return Response.json({ error: "Store not found" }, { status: 404 });
    }

    const store = data as unknown as StoreWithProducts;
    const active = store.products.filter((p) => p.is_active);

    const systemPrompt = [
      store.ai_personality ?? "أنا مساعد متجر ودود ومحترف يساعد العملاء في إيجاد ما يحتاجونه",
      "",
      `اسم المتجر: ${store.name_ar ?? store.name}`,
      "",
      "المنتجات المتاحة:",
      ...active.map(
        (p) =>
          `- ${p.name_ar ?? p.name}: ${p.price} ريال (${p.stock > 0 ? "متوفر" : "نفذ المخزون"})`
      ),
      "",
      "تحدث بود ومهنية. إذا سئلت عن منتج غير موجود في القائمة، أخبر العميل بلطف.",
    ].join("\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        ...history.slice(-10), // keep last 10 messages for context
        { role: "user", content: message },
      ],
    });

    const reply =
      response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({ reply });
  } catch (error) {
    console.error("AI route error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}