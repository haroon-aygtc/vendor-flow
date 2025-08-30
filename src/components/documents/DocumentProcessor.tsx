"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  File, 
  Trash2, 
  Download, 
  Eye, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Bot,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import Cookies from 'js-cookie';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  extractedData?: any;
  processingResults?: any;
  createdAt: string;
  updatedAt: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
}

const DocumentProcessor = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
    fetchAgents();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!selectedAgent) {
      toast({
        title: "Validation Error",
        description: "Please select an agent for processing",
        variant: "destructive",
      });
      return;
    }

    const file = files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/csv', 'text/markdown', 'text/plain'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
      toast({
        title: "Invalid File Type",
        description: "Only PDF, CSV, Markdown, and text files are supported",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agentId', selectedAgent);

      const token = Cookies.get('auth_token');
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments([data.document, ...documents]);
        setShowUploadDialog(false);
        toast({
          title: "Success",
          description: "Document uploaded and processed successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [selectedAgent, documents, toast]);

  const deleteDocument = async (documentId: string) => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== documentId));
        toast({
          title: "Success",
          description: "Document deleted successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Document Processing</h2>
          <p className="text-gray-600">Upload and process documents with AI agents</p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Select an AI agent and upload a document for processing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="agent">Select AI Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent for processing" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.filter(agent => agent.status === 'active').map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} - {agent.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="file">Document File</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="file"
                    accept=".pdf,.csv,.md,.txt"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, CSV, Markdown, Text (Max 10MB)
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button disabled={!selectedAgent || uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Upload & Process
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {agents.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Agents</h3>
            <p className="text-gray-500 mb-4">You need to create AI agents before processing documents</p>
            <Button variant="outline">
              Go to Agents
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {filteredDocuments.length === 0 && agents.length > 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
            <p className="text-gray-500 mb-4">Upload your first document to get started</p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <File className="h-5 w-5 mr-2" />
                    {document.name}
                  </CardTitle>
                  <Badge variant={
                    document.status === 'completed' ? 'default' :
                    document.status === 'processing' ? 'secondary' :
                    document.status === 'error' ? 'destructive' : 'outline'
                  }>
                    {document.status}
                  </Badge>
                </div>
                <CardDescription>
                  {document.type} • {formatFileSize(document.size)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <div className="flex items-center">
                      {getStatusIcon(document.status)}
                      <span className="ml-1 capitalize">{document.status}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Uploaded:</span>
                    <span className="font-medium">{formatTimeAgo(document.createdAt)}</span>
                  </div>

                  {document.status === 'processing' && (
                    <div className="space-y-2">
                      <Progress value={65} className="w-full" />
                      <p className="text-xs text-gray-500">Processing with AI agent...</p>
                    </div>
                  )}

                  {document.status === 'completed' && document.processingResults && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-500">Insights:</span>
                        <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                          {document.processingResults.summary || 'Processing completed successfully'}
                        </div>
                      </div>
                      {document.processingResults.entities && (
                        <div className="flex flex-wrap gap-1">
                          {document.processingResults.entities.slice(0, 3).map((entity: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {entity}
                            </Badge>
                          ))}
                          {document.processingResults.entities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{document.processingResults.entities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {document.status === 'error' && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      Processing failed. Please try again.
                    </div>
                  )}

                  <div className="pt-3 border-t flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDocument(document)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(document.url, '_blank')}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteDocument(document.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
            <DialogDescription>
              Document details and processing results
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 font-medium">{selectedDocument.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Size:</span>
                  <span className="ml-2 font-medium">{formatFileSize(selectedDocument.size)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 font-medium capitalize">{selectedDocument.status}</span>
                </div>
                <div>
                  <span className="text-gray-500">Uploaded:</span>
                  <span className="ml-2 font-medium">{formatTimeAgo(selectedDocument.createdAt)}</span>
                </div>
              </div>

              {selectedDocument.processingResults && (
                <div className="space-y-4">
                  <h4 className="font-medium">Processing Results</h4>
                  
                  {selectedDocument.processingResults.summary && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Summary</h5>
                      <p className="text-sm bg-gray-50 p-3 rounded">
                        {selectedDocument.processingResults.summary}
                      </p>
                    </div>
                  )}

                  {selectedDocument.processingResults.entities && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Entities</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedDocument.processingResults.entities.map((entity: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {entity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDocument.processingResults.insights && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Insights</h5>
                      <ul className="text-sm space-y-1">
                        {selectedDocument.processingResults.insights.map((insight: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedDocument.extractedData && (
                <div>
                  <h4 className="font-medium mb-2">Extracted Content</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm max-h-60 overflow-auto">
                    <pre className="whitespace-pre-wrap">
                      {selectedDocument.extractedData.text?.substring(0, 1000)}
                      {selectedDocument.extractedData.text?.length > 1000 && '...'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentProcessor;
export { DocumentProcessor };