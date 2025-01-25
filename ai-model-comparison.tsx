import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Papa from 'papaparse';

const modelData = {
  'OpenAI': {
    'GPT-4': {
      versions: ['4-Opus', '4-Onyx', '4O', 'O1'],
      contextWindow: {
        '4-Opus': 128000,
        '4-Onyx': 128000,
        '4O': 256000,
        'O1': 512000
      },
      responseLimit: {
        '4-Opus': 4096,
        '4-Onyx': 4096,
        '4O': 8192,
        'O1': 16384
      },
      inputCost: {
        '4-Opus': 0.01,
        '4-Onyx': 0.015,
        '4O': 0.02,
        'O1': 0.025
      },
      outputCost: {
        '4-Opus': 0.03,
        '4-Onyx': 0.045,
        '4O': 0.06,
        'O1': 0.075
      }
    }
  },
  'Anthropic': {
    'Claude': {
      versions: ['3-Opus', '3-Sonnet', '3-Haiku', '3.5-Sonnet'],
      contextWindow: {
        '3-Opus': 200000,
        '3-Sonnet': 150000,
        '3-Haiku': 100000,
        '3.5-Sonnet': 200000
      },
      responseLimit: {
        '3-Opus': 4096,
        '3-Sonnet': 4096,
        '3-Haiku': 2048,
        '3.5-Sonnet': 4096
      },
      inputCost: {
        '3-Opus': 0.015,
        '3-Sonnet': 0.003,
        '3-Haiku': 0.0015,
        '3.5-Sonnet': 0.005
      },
      outputCost: {
        '3-Opus': 0.075,
        '3-Sonnet': 0.015,
        '3-Haiku': 0.007,
        '3.5-Sonnet': 0.025
      }
    }
  },
  'Google': {
    'Gemini': {
      versions: ['2.0-Ultra', '2.0-Pro', '1.5-Pro'],
      contextWindow: {
        '2.0-Ultra': 128000,
        '2.0-Pro': 64000,
        '1.5-Pro': 32000
      },
      responseLimit: {
        '2.0-Ultra': 8192,
        '2.0-Pro': 4096,
        '1.5-Pro': 2048
      },
      inputCost: {
        '2.0-Ultra': 0.012,
        '2.0-Pro': 0.003,
        '1.5-Pro': 0.002
      },
      outputCost: {
        '2.0-Ultra': 0.024,
        '2.0-Pro': 0.006,
        '1.5-Pro': 0.004
      }
    }
  },
  'Meta': {
    'Llama': {
      versions: ['Llama-3.1-70b', 'Llama-3.1-13b', 'Llama-3.2-70b', 'Llama-3.2-13b'],
      contextWindow: {
        'Llama-3.1-70b': 4096,
        'Llama-3.1-13b': 4096,
        'Llama-3.2-70b': 8192,
        'Llama-3.2-13b': 8192
      },
      responseLimit: {
        'Llama-3.1-70b': 2048,
        'Llama-3.1-13b': 2048,
        'Llama-3.2-70b': 4096,
        'Llama-3.2-13b': 4096
      },
      inputCost: 'Self-hosted',
      outputCost: 'Self-hosted'
    }
  },
  'Mistral': {
    'Mistral': {
      versions: ['Large', 'Medium', 'Small'],
      contextWindow: {
        'Large': 32768,
        'Medium': 32768,
        'Small': 32768
      },
      responseLimit: {
        'Large': 2048,
        'Medium': 2048,
        'Small': 2048
      },
      inputCost: {
        'Large': 0.007,
        'Medium': 0.002,
        'Small': 0.0006
      },
      outputCost: {
        'Large': 0.021,
        'Medium': 0.006,
        'Small': 0.0018
      }
    }
  }
};

const TokenCalculator = () => {
  const [provider, setProvider] = useState('OpenAI');
  const [model, setModel] = useState('GPT-4');
  const [version, setVersion] = useState('4-Opus');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [fileError, setFileError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState({
    promptTokens: 0,
    responseTokens: 0,
    totalCost: 0,
    withinLimits: true,
    isHosted: true
  });

  const calculateTokens = (text) => Math.ceil(text.length / 4);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError('');
    setIsProcessing(true);

    try {
      if (file.type === 'text/csv') {
        const text = await file.text();
        const result = Papa.parse(text, { 
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });
        setPrompt(JSON.stringify(result.data, null, 2));
      } else if (file.type === 'application/json') {
        const text = await file.text();
        const json = JSON.parse(text);
        setPrompt(JSON.stringify(json, null, 2));
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const text = await new TextDecoder().decode(uint8Array);
        setPrompt(text);
      } else {
        const text = await file.text();
        setPrompt(text);
      }
    } catch (error) {
      setFileError('Error reading file: ' + error.message);
      console.error('File processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCost = (cost) => {
    if (typeof cost === 'number') {
      return `$${cost.toFixed(4)}`;
    }
    return cost;
  };

  useEffect(() => {
    const promptTokens = calculateTokens(prompt);
    const responseTokens = calculateTokens(response);
    const totalTokens = promptTokens + responseTokens;
    
    const modelInfo = modelData[provider][model];
    const contextWindow = modelInfo.contextWindow[version];
    const responseLimit = modelInfo.responseLimit?.[version];
    
    // Check if the model is self-hosted
    const isHosted = typeof modelInfo.inputCost !== 'string' && typeof modelInfo.outputCost !== 'string';
    
    let totalCost = 'Self-hosted';
    if (isHosted) {
      const inputCost = modelInfo.inputCost[version];
      const outputCost = modelInfo.outputCost[version];
      totalCost = (promptTokens * inputCost + responseTokens * outputCost) / 1000;
    }
    
    const withinContext = typeof contextWindow === 'number' ? totalTokens <= contextWindow : true;
    const withinResponse = typeof responseLimit === 'number' ? responseTokens <= responseLimit : true;
    
    setMetrics({
      promptTokens,
      responseTokens,
      totalCost,
      withinLimits: withinContext && withinResponse,
      isHosted
    });
  }, [prompt, response, provider, model, version]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">Token Cost Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      setModel(Object.keys(modelData[e.target.value])[0]);
                      setVersion(modelData[e.target.value][Object.keys(modelData[e.target.value])[0]].versions[0]);
                    }}
                  >
                    {Object.keys(modelData).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      setVersion(modelData[provider][e.target.value].versions[0]);
                    }}
                  >
                    {Object.keys(modelData[provider]).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  >
                    {modelData[provider][model].versions.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File (Optional)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      className="w-full p-2 border rounded-lg"
                      onChange={handleFileUpload}
                      accept=".txt,.md,.json,.csv,.pdf"
                      disabled={isProcessing}
                    />
                    <p className="text-sm text-gray-500">
                      Supports: TXT, Markdown, JSON, CSV, and PDF files
                    </p>
                    {isProcessing && (
                      <div className="text-blue-600">Processing file...</div>
                    )}
                    {fileError && (
                      <div className="text-red-600">{fileError}</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Input Prompt</label>
                  <textarea
                    className="w-full h-32 p-3 border rounded-lg resize-none"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt or upload a file..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Response</label>
                  <textarea
                    className="w-full h-32 p-3 border rounded-lg resize-none"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Expected response length..."
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Cost Analysis</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-medium">Input Tokens:</span>
                    <span className="text-lg">{metrics.promptTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-medium">Output Tokens:</span>
                    <span className="text-lg">{metrics.responseTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-medium">Context Window:</span>
                    <span className="text-lg">
                      {modelData[provider][model].contextWindow[version].toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-medium">Response Limit:</span>
                    <span className="text-lg">
                      {modelData[provider][model].responseLimit[version].toLocaleString()}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg shadow-sm ${
                    metrics.withinLimits ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <span className="font-medium">Status:</span>
                    <span className={`text-lg ${
                      metrics.withinLimits ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metrics.withinLimits ? '✓ Within Limits' : '⚠️ Exceeds Limits'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg shadow-sm">
                    <span className="font-semibold">Estimated Cost:</span>
                    <span className="text-xl text-blue-600 font-bold">
                      {formatCost(metrics.totalCost)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Pricing Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Input Cost (per 1K tokens):</span>
                    <span>
                      {metrics.isHosted 
                        ? formatCost(modelData[provider][model].inputCost[version])
                        : modelData[provider][model].inputCost}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Output Cost (per 1K tokens):</span>
                    <span>
                      {metrics.isHosted
                        ? formatCost(modelData[provider][model].outputCost[version])
                        : modelData[provider][model].outputCost}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenCalculator;
