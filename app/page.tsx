"use client";
import ChatGPT from "@/app/chatgpt";
import PresentationTest from '@/components/PresentationTest';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <PresentationTest />
    </main>
  );
}