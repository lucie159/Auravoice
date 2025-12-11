"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { VoiceRecorder } from "@/components/voice-recorder"
import { CallReportView } from "@/components/call-report-view"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import type { CallReport } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, Mic } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AnalyzePage() {
  const { user } = useAuth()
  const [report, setReport] = useState<CallReport | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true)
    setError(null)
    try {
      const result = await apiClient.analyzeAudio(file, user?.id)
      setReport(result)
    } catch (err) {
      console.error("Error analyzing audio:", err)
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setError(null)
    try {
      const result = await apiClient.analyzeRecording(audioBlob, user?.id)
      setReport(result)
    } catch (err) {
      console.error("Error analyzing recording:", err)
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setReport(null)
    setError(null)
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          {report ? (
            <Button variant="ghost" onClick={handleReset} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Nouvelle analyse
            </Button>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground">Analyse Post-Appel</h1>
              <p className="text-sm text-muted-foreground">
                Téléversez un fichier audio ou enregistrez directement pour obtenir une analyse émotionnelle
              </p>
            </>
          )}
        </div>

        {/* Error message */}
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        {/* Content */}
        {report ? (
          <CallReportView report={report} />
        ) : (
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Fichier audio
              </TabsTrigger>
              <TabsTrigger value="record" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Microphone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
            </TabsContent>

            <TabsContent value="record">
              <VoiceRecorder onRecordingComplete={handleRecordingComplete} isProcessing={isProcessing} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
