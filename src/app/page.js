import Header from "@/components/Header";
import VoiceRecognition from "@/components/VoiceRecognition";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto py-8">
        <VoiceRecognition />
      </div>
    </main>
  );
}
