import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const baseUrl = process.env.API_URL || "http://localhost:3005/api";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const backendRes = await fetch(`${baseUrl}/reports`, {
        method: "POST",
        body: formData,
      });

      const data = await backendRes.json().catch(() => null);

      if (!backendRes.ok) {
        return NextResponse.json(
          data || { success: false, message: `Gagal mengirim laporan (Status: ${backendRes.status})` },
          { status: backendRes.status }
        );
      }

      return NextResponse.json(data);
    } else {
      const json = await request.json().catch(() => ({}));

      const backendRes = await fetch(`${baseUrl}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(json),
      });

      const data = await backendRes.json().catch(() => null);

      if (!backendRes.ok) {
        return NextResponse.json(
          data || { success: false, message: `Gagal mengirim laporan (Status: ${backendRes.status})` },
          { status: backendRes.status }
        );
      }

      return NextResponse.json(data);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server";
    console.error("Gagal meneruskan laporan ke backend:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const baseUrl = process.env.API_URL || "http://localhost:3005/api";
    const queryString = searchParams.toString();
    const targetUrl = queryString ? `${baseUrl}/reports?${queryString}` : `${baseUrl}/reports`;

    const backendRes = await fetch(targetUrl, {
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server";
    console.error("Gagal mengambil daftar laporan:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
