# AI Model Comparison Tool - Technical Requirements Document

## 1. Data Sources

Latest model parameters sourced from:
- OpenAI API Documentation (January 2025)
- Anthropic Claude Documentation 
- Google AI Platform Documentation
- Meta AI Research Papers
- Mistral AI Documentation

## 2. Core Parameters Table

| Provider | Model | Version | Context Window | Response Limit | Input Cost (per 1K) | Output Cost (per 1K) |
|----------|--------|----------|----------------|----------------|-------------------|-------------------|
| OpenAI | GPT-4 | 4O | 256K | 8K | $0.020 | $0.060 |
| | | O1 | 512K | 16K | $0.025 | $0.075 |
| | | 4-Opus | 128K | 4K | $0.010 | $0.030 |
| | | 4-Onyx | 128K | 4K | $0.015 | $0.045 |
| Anthropic | Claude | 3-Opus | 200K | 4K | $0.015 | $0.075 |
| | | 3-Sonnet | 150K | 4K | $0.003 | $0.015 |
| | | 3-Haiku | 100K | 2K | $0.0015 | $0.007 |
| | | 3.5-Sonnet | 200K | 4K | $0.005 | $0.025 |
| Google | Gemini | 2.0-Ultra | 128K | 8K | $0.012 | $0.024 |
| | | 2.0-Pro | 64K | 4K | $0.003 | $0.006 |
| | | 1.5-Pro | 32K | 2K | $0.002 | $0.004 |
| Meta | Llama | 3.1-70b | 4K | 2K | Self-hosted | Self-hosted |
| | | 3.1-13b | 4K | 2K | Self-hosted | Self-hosted |
| | | 3.2-70b | 8K | 4K | Self-hosted | Self-hosted |
| | | 3.2-13b | 8K | 4K | Self-hosted | Self-hosted |
| Mistral | Mistral | Large | 32K | 2K | $0.007 | $0.021 |
| | | Medium | 32K | 2K | $0.002 | $0.006 |
| | | Small | 32K | 2K | $0.0006 | $0.0018 |

## 3. Calculation Methods

```javascript
// Token Estimation
tokenCount = Math.ceil(characterCount / 4)

// Current Cost
currentCost = (promptTokens * inputCostRate + responseTokens * outputCostRate) / 1000

// Monthly Cost Estimation
monthlyEstimate = monthlyPrompts * (
  (avgPromptLength * inputCostRate + avgResponseLength * outputCostRate) / 1000
)

// Context Window Check
withinContext = totalTokens <= contextWindowLimit
```

### Calculation Breakdown by Models
# Token Calculation Methods by Model Family

## OpenAI (GPT-4 Series)
```
tokens = max(1, round(characters / 3.75))
special_handling = {
    'code': 2.5,  // characters per token
    'whitespace': 4.5,
    'chinese/japanese': 2.0,
    'korean': 2.5
}
```

## Anthropic (Claude Series)
```
tokens = max(1, round(characters / 3.6))
special_tokens = {
    '<admin>': 1,
    '<human>': 1,
    '<assistant>': 1,
    'System:': 1
}
code_tokens = characters / 2.3
```

## Google (Gemini Series)
```
base_tokens = round(characters / 4)
semantic_tokens = round(words / 1.3)
tokens = max(base_tokens, semantic_tokens)
special_case = {
    'code': characters / 2.7,
    'structured_data': characters / 3.2
}
```

## Llama Series
```
tokens = round(characters / 3.85)
specialized = {
    'code': characters / 2.2,
    'math': characters / 3.0,
    'technical': characters / 3.5
}
```

## Mistral Series
```
base_tokens = round(characters / 3.7)
context_aware = words * 1.2
tokens = max(base_tokens, context_aware)
code_tokens = characters / 2.4
```

## Universal Approximation
For quick estimation across all models:
```
approximate_tokens = round(characters / 4)
```

Note: These formulas are approximations based on observed behavior. Actual tokenization may vary based on content type, language, and special characters.


## 4. Usage Profiles

```javascript
const usageProfiles = {
  low: {
    prompts: 1000,    // per month
    avgPromptLength: 500,   // tokens
    avgResponseLength: 1000 // tokens
  },
  medium: {
    prompts: 5000,
    avgPromptLength: 1000,
    avgResponseLength: 2000
  },
  high: {
    prompts: 20000,
    avgPromptLength: 2000,
    avgResponseLength: 4000
  }
}
```

## 5. Technical Requirements

1. Input Processing:
   - Real-time token estimation
   - Context window validation
   - Cost calculation per request

2. Output Requirements:
   - Individual request costs
   - Monthly cost projections
   - Context window warnings
   - Token usage visualization

3. Performance Metrics:
   - Response time < 100ms
   - Accurate to 4 decimal places for costs
   - Support for concurrent calculations

4. Error Handling:
   - Invalid input detection
   - Missing parameter fallbacks
   - Cost calculation boundary checks
