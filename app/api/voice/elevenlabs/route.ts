import { NextResponse } from "next/server";
import { proxyFetch } from "@/lib/proxy-fetch";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
        const baseUrl = (typeof body.baseUrl === "string" && body.baseUrl.trim() ? body.baseUrl.trim() : "https://api.elevenlabs.io/v1").replace(/\/$/, "");
        const voiceId = typeof body.voiceId === "string" ? body.voiceId.trim() : "21m00Tcm4TlvDq8ikWAM";
        const text = typeof body.text === "string" ? body.text : "";
        const model = typeof body.model === "string" ? body.model : "eleven_multilingual_v2";
        const stability = typeof body.stability === "number" ? body.stability : 0.34;
        const style = typeof body.style === "number" ? body.style : 0.84;

        if (!apiKey) {
            return NextResponse.json({ error: "missing_api_key", message: "ElevenLabs API Key 未配置" }, { status: 400 });
        }
        if (!text.trim()) {
            return NextResponse.json({ error: "empty_text", message: "文本内容不能为空" }, { status: 400 });
        }

        const response = await proxyFetch(`${baseUrl}/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
            },
            body: JSON.stringify({
                text,
                model_id: model,
                voice_settings: {
                    stability,
                    similarity_boost: 0.75,
                    style,
                    use_speaker_boost: true,
                },
            }),
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => "");
            return NextResponse.json({ error: "tts_failed", message: `ElevenLabs API 错误 (${response.status}): ${errText}` }, { status: 502 });
        }

        const audioBuffer = await response.arrayBuffer();
        return new Response(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-cache",
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: "internal_error", message: err?.message || String(err) }, { status: 500 });
    }
}
