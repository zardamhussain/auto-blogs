import os
import asyncio
from tavily import TavilyClient
from firecrawl import AsyncFirecrawlApp

class GoogleSearchService:
    def __init__(self):
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        self.firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")
        
        self.tavily_client = TavilyClient(api_key=self.tavily_api_key) if self.tavily_api_key else None
        self.firecrawl_app = AsyncFirecrawlApp(api_key=self.firecrawl_api_key) if self.firecrawl_api_key else None

    async def _scrape_url_content(self, url: str) -> dict:
        """Asynchronously scrapes content from a single URL using Firecrawl."""
        if not self.firecrawl_app:
            return {'url': url, 'content': 'Firecrawl not configured.', 'status': 'error'}
        try:
            # The 'formats' parameter is not valid for scrape_url, removing it.
            response = await self.firecrawl_app.scrape_url(url=url,formats=['markdown'],only_main_content=True)
            # Accessing markdown content correctly from the response object.
            return {'url': url, 'content': response.markdown, 'status': 'success'}
        except Exception as e:
            return {'url': url, 'content': f"Error scraping: {e}", 'status': 'error'}

    async def search_and_scrape(self, query: str = None, web_search_query: str = None, count: int = 5) -> dict:
        """Searches the web and scrapes results."""
        if not self.tavily_client:
            print("Skipping web search: Tavily not configured.")
            return {}
            
        search_query = web_search_query or query
        if not search_query:
            raise ValueError("No query provided to google_search node.")

        print(f"Searching web for '{search_query}'...")
        try:
            search_results = self.tavily_client.search(query=search_query, search_depth="advanced", max_results=count)
            urls = [result['url'] for result in search_results.get('results', [])]
        except Exception as e:
            print(f"Error during Tavily search: {e}")
            return {}
        if not urls:
            return {}
        
        print("urls: ", urls)
        tasks = [self._scrape_url_content(url) for url in urls]
        scraped_contents = await asyncio.gather(*tasks)
        print(f"Scraped {len(scraped_contents)} URLs.")
        
        web_search_data = [item for item in scraped_contents if item['status'] == 'success']
        return {"web_search_data": {"scraped_content": web_search_data}} 