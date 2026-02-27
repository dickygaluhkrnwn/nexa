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
    // Tambahan variabel imageBase64 dan mimeType untuk OCR
    const { action, content, prompt: userPrompt, context, imageBase64, mimeType } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let finalPrompt = "";
    // Kita gunakan array agar bisa menampung teks biasa, ATAU teks + gambar
    let generateParams: any[] = []; 

    // Logika berdasarkan aksi yang diminta
    switch (action) {
      case "auto-tag":
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        finalPrompt = `
          Baca catatan berikut dan berikan maksimal 3 tag/kategori yang paling relevan.
          Format balasan harus HANYA berupa kata-kata yang dipisahkan koma, tanpa simbol hashtag (#), tanpa penjelasan tambahan.
          Contoh balasan: Ide, Pekerjaan, Prioritas Tinggi
          
          Catatan:
          "${content}"
        `;
        generateParams = [finalPrompt];
        break;

      case "summarize":
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        finalPrompt = `
          Buatlah ringkasan singkat dan padat (maksimal 3 kalimat) dari catatan berikut.
          Fokus pada poin utama atau tindakan yang harus dilakukan.
          
          Catatan:
          "${content}"
        `;
        generateParams = [finalPrompt];
        break;

      case "chat":
        if (!userPrompt) return NextResponse.json({ error: "Prompt is required for chat" }, { status: 400 });
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
        generateParams = [finalPrompt];
        break;

      case "ocr":
        if (!imageBase64) return NextResponse.json({ error: "Image Base64 is required for OCR" }, { status: 400 });
        // Prompt khusus OCR untuk mengekstrak teks ke HTML
        finalPrompt = `Ekstrak seluruh teks yang ada di gambar ini dengan sangat akurat. 
        PENTING: Outputkan hasilnya dalam format HTML dasar (seperti <p>, <br>, <strong>, <ul>, <li>) agar bisa langsung dimasukkan ke Text Editor.
        JANGAN sertakan awalan \`\`\`html atau akhiran \`\`\`. Hanya berikan elemen HTML-nya saja.`;
        
        const imagePart = {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || "image/jpeg",
          },
        };
        // Masukkan prompt teks dan objek gambar sekaligus
        generateParams = [finalPrompt, imagePart];
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Eksekusi model dengan parameter yang sudah disiapkan
    const result = await model.generateContent(generateParams);
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