"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  FileText,
  Upload,
  X,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { GuideTooltip } from "@/components/ui/user-guide";

interface DocumentProcessorProps {
  onProcessComplete?: (result: any) => void;
  availableAgents?: Array<{ id: string; name: string }>;
}

const DocumentProcessor = ({
  onProcessComplete = () => {},
  availableAgents = [
    { id: "agent-1", name: "Document Analyzer" },
    { id: "agent-2", name: "Data Extractor" },
    { id: "agent-3", name: "Content Summarizer" },
  ],
}: DocumentProcessorProps) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "csv", "md", "txt"].includes(fileExtension || "")) {
      setError(
        "Unsupported file type. Please upload PDF, CSV, Markdown, or TXT files.",
      );
      return;
    }

    setSelectedFile(file);
    setFileType(fileExtension || null);

    // Create preview for supported file types
    if (fileExtension === "pdf") {
      // For PDF, we'll just show an icon and name since we can't easily preview
      setFilePreview(null);
    } else if (
      fileExtension === "csv" ||
      fileExtension === "md" ||
      fileExtension === "txt"
    ) {
      // For text-based files, read and display content
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsText(file);
    }

    setActiveTab("preview");
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
    setActiveTab("upload");
    setError(null);
  };

  const handleProcessDocument = () => {
    if (!selectedFile || !selectedAgent) {
      setError(
        "Please select both a file and an agent to process the document.",
      );
      return;
    }

    setProcessing(true);
    setProgress(0);

    // Simulate processing with progress updates
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setProcessing(false);
            setActiveTab("results");
            // Mock result data
            onProcessComplete({
              documentName: selectedFile.name,
              agentUsed: availableAgents.find(
                (agent) => agent.id === selectedAgent,
              )?.name,
              processingTime: "00:12",
              extractedData: {
                entities: ["Company X", "Product Y", "Service Z"],
                keyInsights: [
                  "Market growth of 12%",
                  "Customer satisfaction at 87%",
                  "Competitor analysis shows opportunity in segment A",
                ],
                summary:
                  "This document provides an overview of market trends and opportunities for Company X's products and services.",
              },
            });
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  const renderFileIcon = () => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-12 w-12 text-blue-500" />;
      case "csv":
        return <FileSpreadsheet className="h-12 w-12 text-green-500" />;
      case "md":
      case "txt":
        return <FileCode className="h-12 w-12 text-purple-500" />;
      default:
        return <FileText className="h-12 w-12 text-gray-500" />;
    }
  };

  const renderPreview = () => {
    if (!selectedFile) return null;

    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {renderFileIcon()}
            <div>
              <h3 className="font-medium">{selectedFile.name}</h3>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(2)} KB •{" "}
                {fileType?.toUpperCase()}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {fileType === "pdf" ? (
          <div className="border rounded-md p-8 flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">
              PDF preview not available. Process the document to view results.
            </p>
          </div>
        ) : (
          <div className="border rounded-md p-4 max-h-[400px] overflow-auto bg-muted">
            <pre className="text-xs whitespace-pre-wrap">{filePreview}</pre>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    return (
      <div className="space-y-4">
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Document Analysis Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Entities Detected</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>Company X</li>
                <li>Product Y</li>
                <li>Service Z</li>
              </ul>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Key Insights</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>Market growth of 12%</li>
                <li>Customer satisfaction at 87%</li>
                <li>Competitor analysis shows opportunity</li>
              </ul>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Summary</p>
              <p className="text-sm text-muted-foreground">
                This document provides an overview of market trends and
                opportunities for Company X's products and services.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setActiveTab("preview")}>
            Back to Document
          </Button>
          <Button>Export Results</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-background">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Document Processor</CardTitle>
          <CardDescription>
            Upload and process documents with AI agents to extract insights and
            structured data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <GuideTooltip content="Upload PDF, CSV, Markdown, or text files">
                <TabsTrigger value="upload" data-guide="document-upload">Upload</TabsTrigger>
              </GuideTooltip>
              <GuideTooltip content="Preview your document before processing">
                <TabsTrigger value="preview" disabled={!selectedFile}>
                  Preview
                </TabsTrigger>
              </GuideTooltip>
              <GuideTooltip content="View AI analysis results and insights">
                <TabsTrigger
                  value="results"
                  disabled={!processing && activeTab !== "results"}
                >
                  Results
                </TabsTrigger>
              </GuideTooltip>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <GuideTooltip content="Click to select files or drag and drop here">
                <div className="border-2 border-dashed rounded-lg p-8 text-center" data-guide="document-upload">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-1">Upload Document</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop or click to upload PDF, CSV, or Markdown files
                  </p>
                  <div className="flex justify-center">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm">
                        Select File
                      </div>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.csv,.md,.txt"
                        onChange={handleFileChange}
                      />
                    </Label>
                  </div>
                </div>
              </GuideTooltip>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {renderPreview()}

              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <GuideTooltip content="Choose which AI agent will analyze your document">
                    <Label htmlFor="agent-select">
                      Select Agent for Processing
                    </Label>
                  </GuideTooltip>
                  <Select
                    value={selectedAgent || undefined}
                    onValueChange={setSelectedAgent}
                  >
                    <SelectTrigger id="agent-select">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleRemoveFile}>
                    Cancel
                  </Button>
                  <GuideTooltip content="Start AI analysis of your document">
                    <Button
                      onClick={handleProcessDocument}
                      disabled={processing || !selectedAgent}
                      data-guide="process-document"
                    >
                      {processing ? "Processing..." : "Process Document"}
                    </Button>
                  </GuideTooltip>
                </div>

                {processing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing document...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results">{renderResults()}</TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, CSV, Markdown, TXT
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DocumentProcessor;