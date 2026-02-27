import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Mengambil API Key dari environment variable
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    // Tambahan prompt dan context untuk fitur Chat RAG
    const { action, content, prompt: userPrompt, context } = body;

    // Validasi input
    if (action !== "chat" && !content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (action === "chat" && !userPrompt) {
      return NextResponse.json({ error: "Prompt is required for chat" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let finalPrompt = "";

    // Logika berdasarkan aksi yang diminta
    switch (action) {
      case "auto-tag":
        finalPrompt = `
          Baca catatan berikut dan berikan maksimal 3 tag/kategori yang paling relevan.
          Format balasan harus HANYA berupa kata-kata yang dipisahkan koma, tanpa simbol hashtag (#), tanpa penjelasan tambahan.
          Contoh balasan: Ide, Pekerjaan, Prioritas Tinggi
          
          Catatan:
          "${content}"
        `;
        break;

      case "summarize":
        finalPrompt = `
          Buatlah ringkasan singkat dan padat (maksimal 3 kalimat) dari catatan berikut.
          Fokus pada poin utama atau tindakan yang harus dilakukan.
          
          Catatan:
          "${content}"
        `;
        break;

      case "chat":
        // Inilah inti dari RAG (Retrieval-Augmented Generation).
        // Kita menyuapkan data catatan user ke dalam otak AI.
        finalPrompt = `
          Kamu adalah "Nexa", asisten AI cerdas, ramah, dan proaktif di aplikasi pencatatan "Super Note AI".
          Tugas utamamu adalah membantu pengguna menjawab pertanyaan BERDASARKAN catatan yang mereka miliki.
          Jawablah dengan bahasa Indonesia yang santai, ringkas, dan jelas.
          Jika jawaban tidak ada di dalam catatan mereka, gunakan pengetahuan umummu tetapi beri tahu mereka bahwa info tersebut tidak ada di catatan.
          
          Berikut adalah daftar catatan milik pengguna sebagai konteksmu:
          ${context || "Pengguna belum memiliki catatan."}
          
          Pertanyaan/Perintah Pengguna:
          "${userPrompt}"
        `;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const result = await model.generateContent(finalPrompt);
    const responseText = result.response.text();

    return NextResponse.json({ result: responseText.trim() });

  } catch (error: any) {
    console.error("Error generating AI content:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}