"use client";

import React, { useState, useEffect } from "react";
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
  Download,
  Eye,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { GuideTooltip } from "@/components/ui/user-guide";
import { clientAIProviderService } from '@/services/clientAIProviderService';
import { Badge } from "@/components/ui/badge";

interface DocumentProcessorProps {
  onProcessComplete?: (result: any) => void;
}

interface ProcessedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  processedAt: Date;
  agentUsed: string;
  result: any;
}

const DocumentProcessor = ({
  onProcessComplete = () => {},
}: DocumentProcessorProps) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [currentResult, setCurrentResult] = useState<any>(null);

  useEffect(() => {
    loadAgents();
    loadProcessedDocuments();
  }, []);

  const loadAgents = () => {
    try {
      const saved = localStorage.getItem('ai-agents');
      if (saved) {
        const agentsData = JSON.parse(saved);
        setAgents(agentsData.filter((a: any) => a.status === 'active'));
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadProcessedDocuments = () => {
    try {
      const saved = localStorage.getItem('processed-documents');
      if (saved) {
        setProcessedDocuments(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load processed documents:', error);
    }
  };

  const saveProcessedDocument = (document: ProcessedDocument) => {
    try {
      const existing = JSON.parse(localStorage.getItem('processed-documents') || '[]');
      const updated = [document, ...existing];
      localStorage.setItem('processed-documents', JSON.stringify(updated));
      setProcessedDocuments(updated);

      // Update dashboard stats
      const activities = JSON.parse(localStorage.getItem('recent-activities') || '[]');
      activities.unshift({
        id: `doc-process-${Date.now()}`,
        type: 'success',
        message: `Document "${document.name}" processed successfully`,
        timestamp: new Date()
      });
      localStorage.setItem('recent-activities', JSON.stringify(activities.slice(0, 50)));
    } catch (error) {
      console.error('Failed to save processed document:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "csv", "md", "txt", "docx"].includes(fileExtension || "")) {
      setError(
        "Unsupported file type. Please upload PDF, CSV, Markdown, TXT, or DOCX files.",
      );
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size too large. Please upload files smaller than 10MB.");
      return;
    }

    setSelectedFile(file);
    setFileType(fileExtension || null);

    // Create preview for supported file types
    if (fileExtension === "pdf" || fileExtension === "docx") {
      setFilePreview(null);
    } else if (
      fileExtension === "csv" ||
      fileExtension === "md" ||
      fileExtension === "txt"
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Limit preview to first 1000 characters
        setFilePreview(content.substring(0, 1000) + (content.length > 1000 ? '...' : ''));
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
    setCurrentResult(null);
  };

  const handleProcessDocument = async () => {
    if (!selectedFile || !selectedAgent) {
      setError(
        "Please select both a file and an agent to process the document.",
      );
      return;
    }

    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const agent = agents.find(a => a.id === selectedAgent);
      if (!agent) {
        throw new Error('Selected agent not found');
      }

      // Read file content
      let fileContent = '';
      if (fileType === 'pdf' || fileType === 'docx') {
        fileContent = `[${fileType.toUpperCase()} Document: ${selectedFile.name}]\nNote: Binary document processing would require specialized libraries in production.`;
      } else {
        fileContent = await readFileAsText(selectedFile);
      }

      setProgress(25);

      // Prepare AI prompt for document analysis
      const analysisPrompt = `Please analyze the following document and provide:
1. A comprehensive summary
2. Key entities mentioned (people, organizations, locations, etc.)
3. Main topics and themes
4. Important insights or findings
5. Any actionable items or recommendations

Document content:
${fileContent.substring(0, 4000)}${fileContent.length > 4000 ? '\n[Content truncated for analysis]' : ''}`;

      setProgress(50);

      // Send to AI agent for processing
      const request = {
        model: agent.modelId,
        messages: [
          { role: "system", content: agent.systemPrompt + "\n\nYou are analyzing a document. Provide structured, detailed analysis." },
          { role: "user", content: analysisPrompt }
        ],
        temperature: agent.temperature,
        maxTokens: Math.min(agent.maxTokens, 2000)
      };

      setProgress(75);

      const response = await clientAIProviderService.sendChatRequest(agent.providerId, request);
      const analysisResult = response.choices[0].message.content;

      setProgress(90);

      // Parse the AI response to extract structured data
      const result = parseAnalysisResult(analysisResult, selectedFile, agent);
      
      setProgress(100);

      // Save processed document
      const processedDoc: ProcessedDocument = {
        id: `doc-${Date.now()}`,
        name: selectedFile.name,
        type: fileType || 'unknown',
        size: selectedFile.size,
        processedAt: new Date(),
        agentUsed: agent.name,
        result
      };

      saveProcessedDocument(processedDoc);
      setCurrentResult(result);
      onProcessComplete(result);
      
      setTimeout(() => {
        setProcessing(false);
        setActiveTab("results");
      }, 500);

    } catch (error) {
      setProcessing(false);
      setError(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Document processing error:', error);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const parseAnalysisResult = (analysisText: string, file: File, agent: any) => {
    // Extract structured data from AI analysis
    const lines = analysisText.split('\n');
    
    const result = {
      summary: '',
      entities: [] as string[],
      topics: [] as string[],
      insights: [] as string[],
      actionItems: [] as string[],
      rawAnalysis: analysisText,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: fileType,
        processedBy: agent.name,
        processingTime: new Date().toISOString()
      }
    };

    // Simple parsing logic (in production, use more sophisticated NLP)
    let currentSection = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.toLowerCase().includes('summary')) {
        currentSection = 'summary';
        continue;
      } else if (trimmed.toLowerCase().includes('entities') || trimmed.toLowerCase().includes('people') || trimmed.toLowerCase().includes('organizations')) {
        currentSection = 'entities';
        continue;
      } else if (trimmed.toLowerCase().includes('topics') || trimmed.toLowerCase().includes('themes')) {
        currentSection = 'topics';
        continue;
      } else if (trimmed.toLowerCase().includes('insights') || trimmed.toLowerCase().includes('findings')) {
        currentSection = 'insights';
        continue;
      } else if (trimmed.toLowerCase().includes('action') || trimmed.toLowerCase().includes('recommendation')) {
        currentSection = 'actionItems';
        continue;
      }
      
      // Add content to appropriate section
      if (currentSection === 'summary' && !result.summary) {
        result.summary = trimmed;
      } else if (currentSection === 'entities' && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./))) {
        result.entities.push(trimmed.replace(/^[-•\d.]\s*/, ''));
      } else if (currentSection === 'topics' && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./))) {
        result.topics.push(trimmed.replace(/^[-•\d.]\s*/, ''));
      } else if (currentSection === 'insights' && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./))) {
        result.insights.push(trimmed.replace(/^[-•\d.]\s*/, ''));
      } else if (currentSection === 'actionItems' && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./))) {
        result.actionItems.push(trimmed.replace(/^[-•\d.]\s*/, ''));
      }
    }

    // Fallback: if no structured data found, extract from raw text
    if (!result.summary) {
      const sentences = analysisText.split('.').filter(s => s.trim().length > 20);
      result.summary = sentences.slice(0, 2).join('.') + '.';
    }

    return result;
  };

  const exportResults = () => {
    if (!currentResult) return;
    
    const exportData = {
      document: selectedFile?.name,
      processedAt: new Date().toISOString(),
      ...currentResult
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${selectedFile?.name || 'document'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

        {fileType === "pdf" || fileType === "docx" ? (
          <div className="border rounded-md p-8 flex items-center justify-center bg-muted">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {fileType.toUpperCase()} preview not available. Process the document to view AI analysis.
              </p>
            </div>
          </div>
        ) : (
          <div className="border rounded-md p-4 max-h-[400px] overflow-auto bg-muted">
            <pre className="text-xs whitespace-pre-wrap font-mono">{filePreview}</pre>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!currentResult) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Document Analysis Results</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportResults}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("preview")}>
              <Eye className="h-4 w-4 mr-2" />
              View Document
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Summary */}
          {currentResult.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{currentResult.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Key Entities */}
          {currentResult.entities && currentResult.entities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Entities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {currentResult.entities.map((entity: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {entity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Topics & Themes */}
          {currentResult.topics && currentResult.topics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Topics & Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {currentResult.topics.map((topic: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground">{topic}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Key Insights */}
          {currentResult.insights && currentResult.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {currentResult.insights.map((insight: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground">{insight}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {currentResult.actionItems && currentResult.actionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Action Items</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {currentResult.actionItems.map((item: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Processing Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Processing Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Processed by:</span>
                  <p className="text-muted-foreground">{currentResult.metadata?.processedBy}</p>
                </div>
                <div>
                  <span className="font-medium">File type:</span>
                  <p className="text-muted-foreground">{currentResult.metadata?.fileType?.toUpperCase()}</p>
                </div>
                <div>
                  <span className="font-medium">File size:</span>
                  <p className="text-muted-foreground">
                    {currentResult.metadata?.fileSize ? (currentResult.metadata.fileSize / 1024).toFixed(2) + ' KB' : 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Processed at:</span>
                  <p className="text-muted-foreground">
                    {currentResult.metadata?.processingTime ? new Date(currentResult.metadata.processingTime).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
            structured data. Supports PDF, CSV, Markdown, TXT, and DOCX files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
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
                  disabled={!currentResult}
                >
                  Results
                </TabsTrigger>
              </GuideTooltip>
              <GuideTooltip content="View previously processed documents">
                <TabsTrigger value="history">
                  History ({processedDocuments.length})
                </TabsTrigger>
              </GuideTooltip>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <GuideTooltip content="Click to select files or drag and drop here">
                <div className="border-2 border-dashed rounded-lg p-8 text-center" data-guide="document-upload">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-1">Upload Document</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop or click to upload PDF, CSV, Markdown, TXT, or DOCX files (max 10MB)
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
                        accept=".pdf,.csv,.md,.txt,.docx"
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

              {agents.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Active Agents</AlertTitle>
                  <AlertDescription>
                    Please create and activate at least one AI agent in the Agents tab to process documents.
                  </AlertDescription>
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
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} ({agent.providerId})
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
                      disabled={processing || !selectedAgent || agents.length === 0}
                      data-guide="process-document"
                    >
                      {processing ? "Processing..." : "Process Document"}
                    </Button>
                  </GuideTooltip>
                </div>

                {processing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing document with AI...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results">{renderResults()}</TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Processing History</h3>
                <Badge variant="secondary">{processedDocuments.length} documents</Badge>
              </div>
              
              {processedDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents processed yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processedDocuments.map((doc) => (
                    <Card key={doc.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {doc.type === 'pdf' ? <FileText className="h-5 w-5 text-blue-500" /> :
                           doc.type === 'csv' ? <FileSpreadsheet className="h-5 w-5 text-green-500" /> :
                           <FileCode className="h-5 w-5 text-purple-500" />}
                          <div>
                            <h4 className="font-medium">{doc.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Processed by {doc.agentUsed} • {new Date(doc.processedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setCurrentResult(doc.result);
                            setActiveTab("results");
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, CSV, Markdown, TXT, DOCX (max 10MB)
          </p>
          {currentResult && (
            <p className="text-xs text-muted-foreground">
              Last processed: {new Date(currentResult.metadata?.processingTime || Date.now()).toLocaleString()}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default DocumentProcessor;