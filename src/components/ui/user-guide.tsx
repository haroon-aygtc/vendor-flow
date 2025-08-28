import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Separator } from './separator';
import { 
  HelpCircle, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Bot,
  Settings,
  FileText,
  GitBranch,
  Users,
  Zap,
  Shield,
  Database,
  Play,
  Eye,
  Upload
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  target: string;
  icon: React.ReactNode;
  category: 'setup' | 'agents' | 'workflows' | 'documents' | 'monitoring';
}

const guideSteps: GuideStep[] = [
  // Setup Steps
  {
    id: 'providers-setup',
    title: 'Connect AI Providers',
    description: 'Add your API keys for OpenAI, Anthropic, Google AI, Groq, or OpenRouter to enable AI capabilities.',
    target: '[data-guide="providers-tab"]',
    icon: <Settings className="h-4 w-4" />,
    category: 'setup'
  },
  {
    id: 'test-connection',
    title: 'Test Provider Connection',
    description: 'Verify your API keys work by testing the connection to each provider.',
    target: '[data-guide="test-connection"]',
    icon: <Zap className="h-4 w-4" />,
    category: 'setup'
  },
  
  // Agent Steps
  {
    id: 'create-agent',
    title: 'Create Your First Agent',
    description: 'Configure an AI agent with specific behavior, model selection, and system prompts.',
    target: '[data-guide="create-agent"]',
    icon: <Bot className="h-4 w-4" />,
    category: 'agents'
  },
  {
    id: 'agent-prompt',
    title: 'Configure System Prompt',
    description: 'Define how your agent behaves by setting clear instructions and context.',
    target: '[data-guide="system-prompt"]',
    icon: <FileText className="h-4 w-4" />,
    category: 'agents'
  },
  {
    id: 'test-agent',
    title: 'Test Agent Responses',
    description: 'Send test messages to verify your agent responds correctly before deployment.',
    target: '[data-guide="test-agent"]',
    icon: <Play className="h-4 w-4" />,
    category: 'agents'
  },
  
  // Workflow Steps
  {
    id: 'workflow-builder',
    title: 'Build Workflows',
    description: 'Create complex AI workflows by connecting agents, tools, and decision points.',
    target: '[data-guide="workflow-canvas"]',
    icon: <GitBranch className="h-4 w-4" />,
    category: 'workflows'
  },
  {
    id: 'add-nodes',
    title: 'Add Workflow Nodes',
    description: 'Drag and drop different node types to build your workflow logic.',
    target: '[data-guide="node-types"]',
    icon: <Users className="h-4 w-4" />,
    category: 'workflows'
  },
  
  // Document Steps
  {
    id: 'upload-document',
    title: 'Upload Documents',
    description: 'Upload PDF, CSV, or Markdown files for AI processing and analysis.',
    target: '[data-guide="document-upload"]',
    icon: <Upload className="h-4 w-4" />,
    category: 'documents'
  },
  {
    id: 'process-document',
    title: 'Process with AI',
    description: 'Select an agent to analyze your documents and extract insights.',
    target: '[data-guide="process-document"]',
    icon: <Eye className="h-4 w-4" />,
    category: 'documents'
  },
  
  // Monitoring Steps
  {
    id: 'monitor-executions',
    title: 'Monitor Performance',
    description: 'Track agent executions, view logs, and analyze performance metrics.',
    target: '[data-guide="performance-metrics"]',
    icon: <Database className="h-4 w-4" />,
    category: 'monitoring'
  }
];

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('setup');
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  const categories = [
    { id: 'setup', label: 'Initial Setup', icon: <Settings className="h-4 w-4" /> },
    { id: 'agents', label: 'AI Agents', icon: <Bot className="h-4 w-4" /> },
    { id: 'workflows', label: 'Workflows', icon: <GitBranch className="h-4 w-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
    { id: 'monitoring', label: 'Monitoring', icon: <Shield className="h-4 w-4" /> }
  ];

  const filteredSteps = guideSteps.filter(step => step.category === selectedCategory);

  useEffect(() => {
    if (isOpen && filteredSteps[currentStep]) {
      const target = document.querySelector(filteredSteps[currentStep].target);
      if (target) {
        setHighlightedElement(target);
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('guide-highlight');
      }
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('guide-highlight');
      }
    };
  }, [currentStep, selectedCategory, isOpen, filteredSteps, highlightedElement]);

  const nextStep = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentStep(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      
      {/* Guide Panel */}
      <div className="fixed right-4 top-4 bottom-4 w-96 bg-background border rounded-lg shadow-lg z-50 flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              User Guide
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {/* Category Selection */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => selectCategory(category.id)}
              >
                {category.icon}
                <span className="ml-2 text-xs">{category.label}</span>
              </Button>
            ))}
          </div>

          <Separator className="mb-4" />

          {/* Current Step */}
          {filteredSteps.length > 0 && (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {filteredSteps[currentStep].icon}
                <h3 className="font-medium">{filteredSteps[currentStep].title}</h3>
                <Badge variant="outline" className="ml-auto">
                  {currentStep + 1} of {filteredSteps.length}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {filteredSteps[currentStep].description}
              </p>

              {/* Step Progress */}
              <div className="flex gap-1 mb-4">
                {filteredSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded ${
                      index <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <Button
              size="sm"
              onClick={nextStep}
              disabled={currentStep === filteredSteps.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </div>

      {/* CSS for highlighting */}
      <style jsx global>{`
        .guide-highlight {
          position: relative;
          z-index: 45;
        }
        
        .guide-highlight::before {
          content: '';
          position: absolute;
          inset: -4px;
          border: 2px solid hsl(var(--primary));
          border-radius: 8px;
          background: hsl(var(--primary) / 0.1);
          animation: pulse 2s infinite;
          pointer-events: none;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};

// Tooltip Helper Component
export const GuideTooltip: React.FC<{
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}> = ({ children, content, side = 'top' }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side}>
          <p className="text-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Quick Tips Component
export const QuickTips: React.FC = () => {
  const tips = [
    {
      icon: <Bot className="h-4 w-4" />,
      title: "Agent Best Practices",
      description: "Use clear, specific system prompts for better AI responses"
    },
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Performance Tip",
      description: "Lower temperature (0.1-0.3) for consistent outputs, higher (0.7-1.0) for creativity"
    },
    {
      icon: <Shield className="h-4 w-4" />,
      title: "Security Note",
      description: "API keys are encrypted and never logged in plain text"
    },
    {
      icon: <Database className="h-4 w-4" />,
      title: "Data Processing",
      description: "Supported formats: PDF, CSV, Markdown, and plain text files"
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">Quick Tips</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tips.map((tip, index) => (
          <div key={index} className="flex gap-3">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              {tip.icon}
            </div>
            <div>
              <p className="text-sm font-medium">{tip.title}</p>
              <p className="text-xs text-muted-foreground">{tip.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};