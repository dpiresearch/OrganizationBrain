
import React, { useState, useCallback, useRef } from 'react';
// FIX: Import LiveServerMessage from @google/genai and remove non-existent LiveSession.
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

// FIX: Remove local LiveServerMessage type to use the one from the SDK.
import type { UploadedFile, ChatMessage, DashboardData, AnalysisResponse } from './types';
import { FileUpload } from './components/FileUpload';
import { ChatInput } from './components/ChatInput';
import { ChatHistory } from './components/ChatHistory';
import { Dashboard } from './components/Dashboard';
import { analyzeData, generateSpeech } from './services/geminiService';
import { playAudio, stopAudio, encode } from './services/audioService';
import { FileText, BrainCircuit } from './components/icons';

const App: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! Upload some documents and ask me anything about your products or organization.",
    },
  ]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Refs for Gemini Live session
  // FIX: Replace non-existent LiveSession with 'any' as the Session type is not exported.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const currentInputTranscriptionRef = useRef<string>('');
  
  const handleFileUpload = (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      name: file.name,
      content: '', // Content will be read later
      fileObject: file,
    }));
    setUploadedFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };
  
  const handleRemoveFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
  };
  
  const handleStopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      stopAudio(audioSourceRef.current);
      audioSourceRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;
    
    // Stop microphone and audio processing
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect();
    inputAudioContextRef.current?.close();

    // Close Gemini Live session
    if (sessionPromiseRef.current) {
      const session = await sessionPromiseRef.current;
      session.close();
    }
    
    // Reset refs
    mediaStreamRef.current = null;
    scriptProcessorRef.current = null;
    inputAudioContextRef.current = null;
    sessionPromiseRef.current = null;
    currentInputTranscriptionRef.current = '';

    setIsRecording(false);
    setLiveTranscript('');
  }, [isRecording]);


  const startRecording = useCallback(async () => {
    if (isRecording) return;
    setIsRecording(true);
    setLiveTranscript('...'); // Initial indicator

    try {
      if (!process.env.API_KEY) throw new Error("API key not configured");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          inputAudioTranscription: {},
          responseModalities: [Modality.AUDIO], // Required, but we won't use the audio output here
        },
        callbacks: {
          onopen: () => {
            if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
            const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };

              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
          },
          // FIX: The onmessage callback should not be async and return void. Using .then() for async operations.
          onmessage: (message: LiveServerMessage) => {
             if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                currentInputTranscriptionRef.current += text;
                setLiveTranscript(currentInputTranscriptionRef.current);
              }
              if (message.serverContent?.turnComplete) {
                const finalTranscript = currentInputTranscriptionRef.current.trim();
                stopRecording().then(() => {
                    if (finalTranscript) {
                      handleSendMessage(finalTranscript);
                    }
                });
              }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Gemini Live error:', e);
            const errorMessage = "Sorry, I couldn't connect to the speech service. Please check your internet connection and try again.";
            setChatHistory((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
            stopRecording();
          },
          onclose: (e: CloseEvent) => {
            // Session closed, cleanup handled in stopRecording
          },
        }
      });

    } catch (error) {
       console.error("Failed to start recording:", error);
       const errorMessage = error instanceof Error && error.message.includes('Permission denied') 
            ? "I can't access your microphone. Please check your browser's permissions."
            : "Failed to initialize microphone.";
       setChatHistory((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
       await stopRecording();
    }
  }, [isRecording, stopRecording]);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleSendMessage = async (message: string) => {
    if (isLoading) return;

    handleStopAudio();
    setIsLoading(true);
    setDashboardData(null);
    setChatHistory((prev) => [...prev, { role: 'user', content: message }]);

    try {
      // Read file contents
      const filesWithContent: UploadedFile[] = await Promise.all(
        uploadedFiles.map(async (file) => {
          if (!file.content && file.fileObject) {
            const content = await file.fileObject.text();
            return { ...file, content };
          }
          return file;
        })
      );
      
      setUploadedFiles(filesWithContent);

      const responseJsonString = await analyzeData(message, filesWithContent);
      let analysisResponse: AnalysisResponse;

      try {
        // The Gemini response for JSON can sometimes have markdown backticks
        const cleanedJson = responseJsonString.replace(/^```json\s*|```\s*$/g, '');
        analysisResponse = JSON.parse(cleanedJson);
      } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", responseJsonString);
        throw new Error("The AI returned an invalid data format. Please try again.");
      }
      
      const { summary, charts } = analysisResponse;

      setChatHistory((prev) => [...prev, { role: 'assistant', content: summary }]);
      if (charts && charts.length > 0) {
        setDashboardData({ charts });
      }

      // Generate and play speech
      const base64Audio = await generateSpeech(summary);
      if (base64Audio) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
           audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        audioSourceRef.current = await playAudio(base64Audio, audioContextRef.current, () => setIsSpeaking(false));
        setIsSpeaking(true);
      }

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setChatHistory((prev) => [...prev, { role: 'assistant', content: `Sorry, I ran into an issue: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Left Panel */}
      <div className="w-1/3 max-w-md bg-gray-800 p-6 flex flex-col h-full border-r border-gray-700">
        <div className="flex items-center mb-6">
          <BrainCircuit className="w-8 h-8 text-indigo-400 mr-3" />
          <h1 className="text-2xl font-bold text-white">Product Intel AI</h1>
        </div>
        <div className="flex-grow flex flex-col overflow-y-auto">
          <FileUpload onFileUpload={handleFileUpload} />
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-3">Uploaded Documents</h2>
            {uploadedFiles.length === 0 ? (
              <p className="text-sm text-gray-500">No files uploaded yet.</p>
            ) : (
              <ul className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded-md text-sm">
                    <div className="flex items-center overflow-hidden">
                      <FileText className="w-4 h-4 text-indigo-400 mr-2 flex-shrink-0" />
                      <span className="truncate" title={file.name}>{file.name}</span>
                    </div>
                    <button onClick={() => handleRemoveFile(file.name)} className="text-gray-400 hover:text-red-400 text-xs font-bold">
                      X
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-2/3 flex flex-col h-full bg-gray-900">
        <main className="flex-grow p-6 overflow-y-auto">
          <ChatHistory
            messages={chatHistory}
            isLoading={isLoading}
            isSpeaking={isSpeaking}
            onStopAudio={handleStopAudio}
          />
          {dashboardData && <Dashboard data={dashboardData} />}
        </main>
        <div className="p-6 border-t border-gray-700 bg-gray-900">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            isRecording={isRecording} 
            onToggleRecording={handleToggleRecording}
            liveTranscript={liveTranscript}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
