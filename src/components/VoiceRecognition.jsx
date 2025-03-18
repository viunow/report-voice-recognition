// src/components/VoiceRecognition.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic, MicOff, Save, Trash, Clipboard } from "lucide-react";

// Lista de comandos médicos comuns para radiologia
const MEDICAL_COMMANDS = {
  "novo parágrafo": "\n\n",
  "nova linha": "\n",
  "apagar última frase": "DELETE_LAST_SENTENCE",
  "limpar tudo": "CLEAR_ALL",
  "salvar laudo": "SAVE_REPORT",
  "inserir template tórax":
    "Os campos pulmonares apresentam transparência preservada, sem evidências de opacidades focais. Não há sinais de consolidação ou derrame pleural. A silhueta cardíaca possui dimensões normais. O mediastino não apresenta alterações.",
};

// Sistema de correção automática para termos médicos
const MEDICAL_TERMS_CORRECTION = {
  "radio opaco": "radiopaco",
  "hemo tórax": "hemotórax",
  "cardio megalia": "cardiomegalia",
  "pneumo tórax": "pneumotórax",
};

export default function VoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [savedReports, setSavedReports] = useState([]);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef(null);
  const textAreaRef = useRef(null);

  useEffect(() => {
    // Verificar se o navegador suporta a API de reconhecimento de voz
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setRecognitionSupported(false);
      return;
    }

    // Inicializar o objeto de reconhecimento de voz
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    // Configurar o reconhecimento de voz
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "pt-BR"; // Configurado para português do Brasil

    // Tratamento dos resultados do reconhecimento
    recognitionRef.current.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcriptText = lastResult[0].transcript;
      const currentConfidence = Math.round(lastResult[0].confidence * 100);
      setConfidence(currentConfidence);

      // Verifica se é um resultado final (não interino)
      if (lastResult.isFinal) {
        // Processa os comandos de voz
        const processedText = processVoiceCommands(transcriptText);

        if (processedText === "CLEAR_ALL") {
          setTranscript("");
        } else if (processedText === "DELETE_LAST_SENTENCE") {
          deleteLastSentence();
        } else if (processedText === "SAVE_REPORT") {
          saveCurrentReport();
        } else if (processedText !== null) {
          // Aplicar correções de termos médicos
          const correctedText = applyMedicalTermsCorrection(processedText);
          setTranscript((prev) => prev + " " + correctedText);
        }
      }
    };

    // Tratamento de erros
    recognitionRef.current.onerror = (event) => {
      console.error("Erro no reconhecimento de voz:", event.error);
      setIsListening(false);
    };

    // Quando o reconhecimento para
    recognitionRef.current.onend = () => {
      // Reinicia automaticamente se ainda estiver no modo de escuta
      if (isListening) {
        recognitionRef.current.start();
      }
    };

    // Limpar ao desmontar o componente
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  // Processa os comandos de voz recebidos
  const processVoiceCommands = (text) => {
    const lowerText = text.toLowerCase().trim();

    // Verifica se o texto corresponde a algum comando conhecido
    for (const [command, action] of Object.entries(MEDICAL_COMMANDS)) {
      if (lowerText.includes(command)) {
        return action;
      }
    }

    return text;
  };

  // Aplica correções para termos médicos comuns
  const applyMedicalTermsCorrection = (text) => {
    let correctedText = text;

    for (const [incorrect, correct] of Object.entries(
      MEDICAL_TERMS_CORRECTION
    )) {
      const regex = new RegExp(incorrect, "gi");
      correctedText = correctedText.replace(regex, correct);
    }

    return correctedText;
  };

  // Remove a última frase do texto
  const deleteLastSentence = () => {
    setTranscript((prev) => {
      const lastSentenceIndex = Math.max(
        prev.lastIndexOf("."),
        prev.lastIndexOf("?"),
        prev.lastIndexOf("!")
      );

      if (lastSentenceIndex === -1) {
        return "";
      }

      return prev.substring(0, lastSentenceIndex + 1);
    });
  };

  // Salva o relatório atual
  const saveCurrentReport = () => {
    if (transcript.trim()) {
      const newReport = {
        id: Date.now(),
        text: transcript,
        date: new Date().toLocaleString(),
      };

      setSavedReports((prev) => [...prev, newReport]);
      setTranscript("");
    }
  };

  // Inicia ou para o reconhecimento de voz
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Limpa o texto atual
  const clearTranscript = () => {
    setTranscript("");
  };

  // Copia o texto para a área de transferência
  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="border border-black/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Assistente de Laudos
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {!recognitionSupported && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              Seu navegador não suporta reconhecimento de voz. Tente usar o
              Chrome ou Edge.
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Texto Ditado</h3>
              {isListening && (
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                  <span className="text-sm">
                    Gravando... ({confidence}% confiança)
                  </span>
                </div>
              )}
            </div>

            <Textarea
              ref={textAreaRef}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Comece a falar para gerar o laudo..."
              className="min-h-[300px] font-mono text-md leading-relaxed"
            />
          </div>

          <div className="mb-2">
            <h4 className="text-sm font-medium mb-1">
              Comandos de voz disponíveis:
            </h4>
            <ul className="text-xs text-gray-600 grid grid-cols-2 gap-1">
              <li>"novo parágrafo" - Insere uma quebra de parágrafo</li>
              <li>"nova linha" - Insere uma quebra de linha</li>
              <li>"apagar última frase" - Remove a última frase</li>
              <li>"limpar tudo" - Apaga todo o texto</li>
              <li>"salvar laudo" - Salva o laudo atual</li>
              <li>
                "inserir template tórax" - Insere texto padrão para laudo de
                tórax
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2 justify-between bg-gray-50 p-4">
          <div className="flex gap-2">
            <Button
              onClick={toggleListening}
              variant={isListening ? "destructive" : "default"}
              className={`flex items-center gap-2 ${
                isListening ? "animate-pulse" : ""
              }`}
              disabled={!recognitionSupported}
            >
              {isListening ? (
                <>
                  <MicOff size={18} /> Parar
                </>
              ) : (
                <>
                  <Mic size={18} /> Iniciar Reconhecimento
                </>
              )}
            </Button>

            <Button
              onClick={clearTranscript}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash size={18} /> Limpar
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clipboard size={18} /> Copiar
            </Button>

            <Button
              onClick={saveCurrentReport}
              className="flex items-center gap-2"
              disabled={!transcript.trim()}
            >
              <Save size={18} /> Salvar Laudo
            </Button>
          </div>
        </CardFooter>
      </Card>

      {savedReports.length > 0 && (
        <div className="mt-8 border border-black/30 shadow-lg rounded-lg p-4">
          <h3 className="text-xl font-bold mb-4">
            Laudos Salvos ({savedReports.length})
          </h3>
          <div className="space-y-4">
            {savedReports.map((report) => (
              <Card key={report.id} className="border shadow bg-blue-100/80">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Laudo #{report.id.toString().slice(-4)}
                    </CardTitle>
                    <span className="text-xs text-gray-500">{report.date}</span>
                  </div>
                </CardHeader>
                <CardContent className="py-0">
                  <p className="whitespace-pre-line text-sm">{report.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
