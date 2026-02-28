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
    const { action, content, prompt: userPrompt, context, imageBase64, mimeType } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let finalPrompt = "";
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

      case "auto-format":
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        finalPrompt = `
          Tugasmu adalah merapikan teks mentah/acak berikut menjadi struktur yang sangat profesional, rapi, dan mudah dibaca.
          Gunakan tag HTML dasar (seperti <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>) untuk menstrukturkannya.
          Jangan mengubah makna asli, cukup perbaiki ejaan, tanda baca, tata bahasa, dan buat susunannya lebih logis (misalnya memisahkan paragraf panjang, membuat bullet points untuk daftar).
          PENTING: Output HANYA berupa kode HTML murni tanpa bungkus markdown block (jangan gunakan \`\`\`html ... \`\`\`).
          
          Teks mentah:
          "${content}"
        `;
        generateParams = [finalPrompt];
        break;

      // --- TAMBAHAN FITUR MIND MAP ---
      case "mindmap":
        if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
        finalPrompt = `
          Buatlah diagram (peta konsep) berformat sintaks Mermaid.js dari catatan berikut.
          PENTING: 
          - Output HANYA berupa kode Mermaid murni.
          - Jangan gunakan markdown block (\`\`\`mermaid ... \`\`\`).
          - Pastikan sintaksnya valid agar tidak error saat di-render.
          - Gunakan format 'mindmap' atau 'graph LR' untuk hierarkinya.
          - Hindari karakter khusus (seperti kutip atau titik dua) di dalam teks node agar tidak merusak render.
          
          Catatan:
          "${content}"
        `;
        generateParams = [finalPrompt];
        break;
      // -----------------------------------------

      case "chat":
        if (!userPrompt) return NextResponse.json({ error: "Prompt is required for chat" }, { status: 400 });
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
        finalPrompt = `Ekstrak seluruh teks yang ada di gambar ini dengan sangat akurat. 
        PENTING: Outputkan hasilnya dalam format HTML dasar (seperti <p>, <br>, <strong>, <ul>, <li>) agar bisa langsung dimasukkan ke Text Editor.
        JANGAN sertakan awalan \`\`\`html atau akhiran \`\`\`. Hanya berikan elemen HTML-nya saja.`;
        
        const imagePart = {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || "image/jpeg",
          },
        };
        generateParams = [finalPrompt, imagePart];
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

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