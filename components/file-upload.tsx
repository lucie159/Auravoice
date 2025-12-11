"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileAudio, Loader2, X } from "lucide-react"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  isProcessing: boolean
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null) // 1. État pour l'URL
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 2. Nettoyage de la mémoire quand l'URL change ou le composant est démonté
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // Fonction utilitaire pour gérer la sélection et la création de l'URL
  const handleFile = (file: File) => {
    if (file.type.startsWith("audio/")) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleSubmit = () => {
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input ref={inputRef} type="file" accept="audio/*" onChange={handleChange} className="hidden" />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <FileAudio className="h-8 w-8 text-primary" />
              </div>
              
              <div className="text-center space-y-1">
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>

              {/* 3. Ajout du lecteur audio ici */}
              {previewUrl && (
                <div className="w-full max-w-sm my-2">
                  <audio 
                    controls 
                    src={previewUrl} 
                    className="w-full h-10 block rounded-md" 
                    style={{ outline: 'none' }}
                  />
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={handleRemove} disabled={isProcessing}>
                  <X className="mr-1 h-4 w-4" />
                  Supprimer
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyse...
                    </>
                  ) : (
                    "Analyser"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="mt-4 text-center">
                <p className="text-foreground">Glissez-déposez un fichier audio ici</p>
                <p className="mt-1 text-sm text-muted-foreground">ou cliquez pour parcourir</p>
              </div>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={() => inputRef.current?.click()}>
                Choisir un fichier
              </Button>
              <p className="mt-4 text-xs text-muted-foreground">Formats supportés: MP3, WAV, OGG, M4A</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}