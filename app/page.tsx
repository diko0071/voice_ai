"use client";
import ChatGPT from "@/app/chatgpt";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <ChatGPT />
    </main>
  );
}