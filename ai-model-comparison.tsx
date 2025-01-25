import React, { useState } from 'react';

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

const monthlyUsageEstimates = {
  low: { prompts: 1000, avgPromptLength: 500, avgResponseLength: 1000 },
  medium: { prompts: 5000, avgPromptLength: 1000, avgResponseLength: 2000 },
  high: { prompts: 20000, avgPromptLength: 2000, avgResponseLength: 4000 }
};

const AIModelComparison = () => {
  const [prompt, setPrompt] = useState('');
  const [expectedResponse, setExpectedResponse] = useState('');
  const [usageLevel, setUsageLevel] = useState('medium');
  const [error, setError] = useState('');

  const calculateTokens = (text) => {
    try {
      return Math.ceil(text.length / 4);
    } catch (e) {
      setError('Error calculating tokens');
      return 0;
    }
  };

  const calculateMonthlyEstimate = (inputCost, outputCost, usage) => {
    if (typeof inputCost === 'string') return inputCost;
    
    const estimate = usage.prompts * (
      (usage.avgPromptLength * inputCost + usage.avgResponseLength * outputCost) / 1000
    );
    return estimate;
  };

  const getModelValue = (property, version) => {
    if (!property) return 'N/A';
    return typeof property === 'object' ? 
      (property[version] || 'N/A') : property;
  };

  const calculateMetrics = (promptText, responseText, model, version) => {
    try {
      const promptTokens = calculateTokens(promptText);
      const responseTokens = calculateTokens(responseText);
      const totalTokens = promptTokens + responseTokens;
      
      const contextWindow = getModelValue(model.contextWindow, version);
      const inputCost = getModelValue(model.inputCost, version);
      const outputCost = getModelValue(model.outputCost, version);
      
      const currentCost = typeof inputCost === 'string' ? inputCost :
        (promptTokens * inputCost + responseTokens * outputCost) / 1000;
      
      const monthlyEstimate = calculateMonthlyEstimate(
        inputCost, 
        outputCost, 
        monthlyUsageEstimates[usageLevel]
      );

      return {
        promptTokens,
        responseTokens,
        totalTokens,
        withinContext: totalTokens <= contextWindow,
        currentCost,
        monthlyEstimate
      };
    } catch (e) {
      setError('Error calculating metrics');
      return {
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0,
        withinContext: false,
        currentCost: 0,
        monthlyEstimate: 0
      };
    }
  };

  return (
    <div className="p-4 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Input Prompt:</label>
          <textarea
            className="w-full h-32 p-2 border rounded"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Expected Response:</label>
          <textarea
            className="w-full h-32 p-2 border rounded"
            value={expectedResponse}
            onChange={(e) => setExpectedResponse(e.target.value)}
            placeholder="Enter expected response length..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Usage Level:</label>
          <select
            className="w-full p-2 border rounded"
            value={usageLevel}
            onChange={(e) => setUsageLevel(e.target.value)}
          >
            <option value="low">Low (~1k prompts/month)</option>
            <option value="medium">Medium (~5k prompts/month)</option>
            <option value="high">High (~20k prompts/month)</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(modelData).map(([org, models]) => (
          <div key={org} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">{org}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Context</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Limit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Monthly</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(models).map(([modelName, model]) => (
                    model.versions.map(version => {
                      const metrics = calculateMetrics(prompt, expectedResponse, model, version);
                      const contextWindow = getModelValue(model.contextWindow, version);
                      const responseLimit = getModelValue(model.responseLimit, version);
                      
                      return (
                        <tr key={`${modelName}-${version}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{modelName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{version}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {typeof contextWindow === 'number' ? contextWindow.toLocaleString() : contextWindow}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {typeof responseLimit === 'number' ? responseLimit.toLocaleString() : responseLimit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metrics.totalTokens.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {typeof metrics.currentCost === 'string' ? metrics.currentCost : 
                             `$${metrics.currentCost.toFixed(4)}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {typeof metrics.monthlyEstimate === 'string' ? metrics.monthlyEstimate :
                             `$${metrics.monthlyEstimate.toFixed(2)}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={metrics.withinContext ? 
                              'text-green-600' : 'text-red-600'}>
                              {metrics.withinContext ? '✓' : '⚠️'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIModelComparison;