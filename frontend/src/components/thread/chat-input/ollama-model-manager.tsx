'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Cpu, 
  Download, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  HardDrive,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OllamaModel {
  id: string;
  name: string;
  display_name: string;
  size: number;
  modified_at: string;
  digest: string;
}

interface ServerStatus {
  status: string;
  accessible: boolean;
  base_url: string;
}

interface OllamaModelManagerProps {
  onModelAdded?: (modelId: string) => void;
}

export const OllamaModelManager: React.FC<OllamaModelManagerProps> = ({ onModelAdded }) => {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [deletingModel, setDeletingModel] = useState<string | null>(null);

  const fetchServerStatus = async () => {
    try {
      const response = await fetch('/api/ollama/status');
      if (response.ok) {
        const status = await response.json();
        setServerStatus(status);
        return status.accessible;
      }
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    }
    return false;
  };

  const fetchModels = async () => {
    setLoading(true);
    try {
      const accessible = await fetchServerStatus();
      if (!accessible) {
        setModels([]);
        return;
      }

      const response = await fetch('/api/ollama/models');
      if (response.ok) {
        const modelList = await response.json();
        setModels(modelList);
      } else {
        console.error('Failed to fetch models');
        setModels([]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const pullModel = async (modelName: string) => {
    setPullingModel(modelName);
    try {
      const response = await fetch('/api/ollama/models/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_name: modelName }),
      });

      if (response.ok) {
        // Refresh the model list
        await fetchModels();
        // Notify parent component
        if (onModelAdded) {
          onModelAdded(`ollama/${modelName}`);
        }
      } else {
        const error = await response.json();
        console.error('Failed to pull model:', error);
      }
    } catch (error) {
      console.error('Error pulling model:', error);
    } finally {
      setPullingModel(null);
    }
  };

  const deleteModel = async (modelName: string) => {
    setDeletingModel(modelName);
    try {
      const response = await fetch('/api/ollama/models/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_name: modelName }),
      });

      if (response.ok) {
        // Refresh the model list
        await fetchModels();
      } else {
        const error = await response.json();
        console.error('Failed to delete model:', error);
      }
    } catch (error) {
      console.error('Error deleting model:', error);
    } finally {
      setDeletingModel(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  useEffect(() => {
    if (isOpen) {
      fetchModels();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Cpu className="h-4 w-4" />
          Manage Ollama Models
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Ollama Model Manager
          </DialogTitle>
          <DialogDescription>
            Discover and manage your local Ollama models. Make sure Ollama is running on your machine.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Server Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Server Status</CardTitle>
            </CardHeader>
            <CardContent>
              {serverStatus ? (
                <div className="flex items-center gap-2">
                  {serverStatus.accessible ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    serverStatus.accessible ? "text-green-600" : "text-red-600"
                  )}>
                    {serverStatus.accessible ? 'Connected' : 'Not Connected'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {serverStatus.base_url}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600">Checking connection...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pull New Model */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Pull New Model</CardTitle>
              <CardDescription>
                Enter a model name to pull from the Ollama registry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="model-name" className="sr-only">Model Name</Label>
                  <Input
                    id="model-name"
                    placeholder="e.g., llama3.2, mistral, codellama"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newModelName.trim()) {
                        pullModel(newModelName.trim());
                        setNewModelName('');
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={() => {
                    if (newModelName.trim()) {
                      pullModel(newModelName.trim());
                      setNewModelName('');
                    }
                  }}
                  disabled={!newModelName.trim() || pullingModel !== null}
                  className="gap-2"
                >
                  {pullingModel ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Pull
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Models List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Available Models</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchModels}
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading models...</span>
                  </div>
                ) : models.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cpu className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No models found</p>
                    <p className="text-sm">Pull a model to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {models.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {model.display_name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {model.name}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {formatFileSize(model.size)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(model.modified_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteModel(model.name)}
                            disabled={deletingModel === model.name}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            {deletingModel === model.name ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 