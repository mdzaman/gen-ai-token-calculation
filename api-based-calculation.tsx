import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

const APIRates = {
  OpenAI: {
    base: 20,      // Base price per million tokens
    tiers: {
      'Tier 1': { limit: 5000000, rate: 1.0 },
      'Tier 2': { limit: 50000000, rate: 0.8 },
      'Tier 3': { limit: null, rate: 0.6 }
    }
  },
  Anthropic: {
    base: 15,
    tiers: {
      'Starter': { limit: 1000000, rate: 1.0 },
      'Growth': { limit: 10000000, rate: 0.85 },
      'Enterprise': { limit: null, rate: 0.7 }
    }
  },
  Google: {
    base: 12,
    tiers: {
      'Basic': { limit: 2000000, rate: 1.0 },
      'Pro': { limit: 20000000, rate: 0.75 },
      'Enterprise': { limit: null, rate: 0.6 }
    }
  }
};

const calculateAPITier = (tokens, provider) => {
  const rates = APIRates[provider];
  if (!rates) return null;

  for (const [tier, { limit, rate }] of Object.entries(rates.tiers)) {
    if (!limit || tokens <= limit) {
      return {
        tier,
        cost: (tokens * rates.base * rate) / 1000000
      };
    }
  }
};

const AIModelComparison = () => {
  const [prompt, setPrompt] = useState('');
  const [expectedResponse, setExpectedResponse] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('OpenAI');
  const [tokenCount, setTokenCount] = useState(0);

  const estimateTokens = (text) => Math.ceil(text.length / 4);

  const updateTokenCount = (promptText, responseText) => {
    const total = estimateTokens(promptText) + estimateTokens(responseText);
    setTokenCount(total);
  };

  const apiCost = calculateAPITier(tokenCount, selectedProvider);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white shadow-lg rounded-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider
              </label>
              <select 
                className="w-full p-2 border rounded-lg bg-white"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
              >
                {Object.keys(APIRates).map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input Prompt
              </label>
              <textarea
                className="w-full h-32 p-3 border rounded-lg bg-white resize-none"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  updateTokenCount(e.target.value, expectedResponse);
                }}
                placeholder="Enter your prompt..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Response
              </label>
              <textarea
                className="w-full h-32 p-3 border rounded-lg bg-white resize-none"
                value={expectedResponse}
                onChange={(e) => {
                  setExpectedResponse(e.target.value);
                  updateTokenCount(prompt, e.target.value);
                }}
                placeholder="Expected response length..."
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-lg rounded-xl">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">API Cost Analysis</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Total Tokens:</span>
                  <span className="text-lg">{tokenCount.toLocaleString()}</span>
                </div>
                {apiCost && (
                  <>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">API Tier:</span>
                      <span className="text-lg">{apiCost.tier}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Estimated Cost:</span>
                      <span className="text-lg text-blue-600">
                        ${apiCost.cost.toFixed(4)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Pricing Tiers</h3>
              <div className="space-y-2">
                {APIRates[selectedProvider]?.tiers && 
                  Object.entries(APIRates[selectedProvider].tiers).map(([tier, { limit, rate }]) => (
                    <div key={tier} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{tier}</span>
                        <span>{rate * 100}% of base rate</span>
                      </div>
                      {limit && (
                        <div className="text-sm text-gray-500 mt-1">
                          Up to {(limit / 1000000).toFixed(1)}M tokens
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AIModelComparison;
