# Ollama Integration for Suna AI Agent

This document explains how to set up and use Ollama with the Suna AI agent to run local language models.

## Overview

Ollama integration allows you to use locally hosted language models with Suna, providing:
- **Privacy**: All model inference happens on your local machine
- **Cost savings**: No API costs for model usage
- **Customization**: Access to a wide variety of open-source models
- **Offline capability**: Work without internet connection

## Prerequisites

1. **Install Ollama**: Download and install Ollama from [ollama.ai](https://ollama.ai)
2. **Start Ollama**: Run `ollama serve` to start the Ollama server
3. **Pull models**: Use `ollama pull <model-name>` to download models

## Configuration

### Backend Configuration

Add the following environment variables to your `.env` file:

```bash
# Ollama configuration
OLLAMA_API_BASE=http://localhost:11434
OLLAMA_API_KEY=  # Usually not needed for local Ollama
```

### Default Configuration

- **API Base URL**: `http://localhost:11434` (default Ollama port)
- **API Key**: Not required for local Ollama instances

## Supported Models

The following Ollama models are pre-configured in Suna:

### Llama Models
- `ollama/llama3.2` - Llama 3.2 (3B, 7B, 70B variants)
- `ollama/llama3.1` - Llama 3.1 (8B, 70B variants)

### Code Models
- `ollama/codellama` - Code Llama (7B, 13B, 34B variants)

### General Purpose Models
- `ollama/mistral` - Mistral (7B variants)
- `ollama/gemma` - Gemma (2B, 7B variants)
- `ollama/phi` - Phi (2, 3 variants)
- `ollama/qwen` - Qwen (7B, 14B, 72B variants)

### Specialized Models
- `ollama/neural-chat` - Neural Chat (7B)
- `ollama/orca-mini` - Orca Mini (3B)

## Usage

### 1. Start Ollama Server

```bash
# Start the Ollama server
ollama serve
```

### 2. Pull Models

```bash
# Pull a specific model
ollama pull llama3.2

# Pull with specific size
ollama pull llama3.2:7b

# Pull other models
ollama pull mistral
ollama pull codellama
```

### 3. Use in Suna

1. **Open the model selector** in the Suna interface
2. **Click "Manage Ollama Models"** to open the Ollama manager
3. **Check server status** - ensure Ollama is running
4. **Pull models** directly from the UI or use the command line
5. **Select an Ollama model** from the dropdown

### 4. Model Management

The Ollama Model Manager provides:
- **Server status monitoring**
- **Model discovery** - see all available models
- **Model pulling** - download new models
- **Model deletion** - remove unused models
- **Model information** - view size, date, and details

## API Endpoints

The following API endpoints are available for Ollama management:

### Server Status
```http
GET /api/ollama/status
```

### List Models
```http
GET /api/ollama/models
```

### Get Model Info
```http
GET /api/ollama/models/{model_name}
```

### Pull Model
```http
POST /api/ollama/models/pull
Content-Type: application/json

{
  "model_name": "llama3.2"
}
```

### Delete Model
```http
DELETE /api/ollama/models/delete
Content-Type: application/json

{
  "model_name": "llama3.2"
}
```

### Health Check
```http
GET /api/ollama/health
```

## Troubleshooting

### Common Issues

1. **Ollama server not accessible**
   - Ensure `ollama serve` is running
   - Check if port 11434 is available
   - Verify firewall settings

2. **Model not found**
   - Pull the model first: `ollama pull <model-name>`
   - Check model name spelling
   - Verify model is available in Ollama registry

3. **Slow performance**
   - Use smaller model variants (3B, 7B instead of 70B)
   - Ensure sufficient RAM and GPU memory
   - Consider using GPU acceleration if available

4. **High memory usage**
   - Close unused models: `ollama rm <model-name>`
   - Use smaller model variants
   - Monitor system resources

### Performance Tips

1. **Model Selection**
   - Use 3B-7B models for faster responses
   - Use 70B models for better quality (requires more resources)

2. **Hardware Requirements**
   - **CPU**: Modern multi-core processor
   - **RAM**: 8GB minimum, 16GB+ recommended
   - **GPU**: Optional but recommended for larger models

3. **Optimization**
   - Use quantized models when available
   - Close unused applications
   - Monitor system resources

## Security Considerations

- **Local only**: Ollama models run entirely on your machine
- **No data transmission**: Model inputs/outputs stay local
- **Network isolation**: No internet connection required for inference
- **Model verification**: Verify model sources before downloading

## Advanced Configuration

### Custom Model Paths

You can configure custom model paths by modifying the Ollama configuration:

```bash
# Set custom model path
export OLLAMA_MODELS=/path/to/custom/models

# Use custom Ollama base URL
export OLLAMA_API_BASE=http://custom-host:11434
```

### Model Customization

Create custom model variants using Ollama Modelfiles:

```dockerfile
# Custom model example
FROM llama3.2:7b

# Add custom system prompt
SYSTEM """You are a helpful AI assistant specialized in coding."""
```

## Support

For issues related to:
- **Ollama installation**: Visit [ollama.ai](https://ollama.ai)
- **Model availability**: Check [ollama.ai/library](https://ollama.ai/library)
- **Suna integration**: Check this documentation or open an issue

## Contributing

To add support for new Ollama models:

1. Add model configuration to `backend/utils/constants.py`
2. Add model to frontend configuration in `frontend/src/components/thread/chat-input/_use-model-selection.ts`
3. Test the integration
4. Update this documentation 