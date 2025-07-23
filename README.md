# AI Blog Generator with Web Search

This project implements an AI-powered blog content generator that creates high-quality, SEO-optimized blog posts based on web search results. The system uses Tavily for search, Firecrawl for content scraping, and Google's Gemini AI for content generation.

## Features

- **Web Search**: Uses Tavily API to find relevant web content
- **Content Scraping**: Uses Firecrawl to extract clean markdown content from web pages
- **Content Generation**: Uses Google Gemini 2.5 Flash to generate high-quality blog posts
- **Parallel Processing**: Processes multiple URLs to create diverse blog content
- **Batch Processing**: For each blog post, processes 2 URLs to ensure rich content

## Requirements

- Python 3.8+
- API Keys:
  - Gemini API key (for content generation)
  - Tavily API key (for web search)
  - Firecrawl API key (for content scraping)

## Installation

1. Clone this repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your API keys:

```
GEMINI_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

## Usage

### Basic Usage

Run the main script to generate blog posts:

```bash
python blog_generator_web_search.py
```

### Test Script

You can also run the test script to verify functionality:

```bash
python test_unified_generator.py
```

## How It Works

1. **Search Phase**: For a given query and desired number of blog posts (n), the system fetches 2\*n URLs using Tavily search
2. **Scraping Phase**: The system scrapes content from all URLs using Firecrawl
3. **Batch Processing**: URLs are processed in batches of 2 (one batch per blog post)
4. **Content Generation**: For each batch, Gemini AI generates a blog post based on the scraped content
5. **Output**: The system saves both JSON and Markdown versions of each generated blog

## Blog Post Format

Each generated blog post follows this structure:

```json
{
  "title": "Engaging question-based title?",
  "description": "SEO-optimized meta description",
  "tags": ["relevant", "seo", "tags"],
  "categories": ["Primary", "Categories"],
  "body": "Markdown content of the blog post"
}
```

## Customization

You can customize the blog generation by modifying:

- Search queries in `blog_generator_web_search.py`
- Number of blogs per query
- Prompt templates in the `generate_blog_content` method

## License

MIT

## Backend (FastAPI)

A new backend using FastAPI is being introduced to handle all business logic and API endpoints. The frontend (Streamlit) will interact with this backend via HTTP APIs.

### How to run the backend

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the backend server:
   ```bash
   uvicorn backend.main:app --reload
   ```

The backend will expose endpoints for blog generation, image generation, and blog post management.
