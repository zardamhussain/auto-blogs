from typing import Dict


class Prompts:
    def redditPrompt(self, discussion: Dict) -> str:
        return f"""
        Create a blog post about skincare based on this Reddit discussion = {discussion}.
        This discussion has {discussion['num_comments']} total comments and a score of {discussion['score']}.
        # Markdown Cheat Sheet 📜

        Markdown is a lightweight markup language for formatting text. Below are common elements you can use.

        ---

        ## 1. Headings
        ```markdown
        ## H2 Heading
        ### H3 Heading
        #### H4 Heading
        ##### H5 Heading
        ###### H6 Heading
        ** for bold

        Format the output as a JSON object with the following schema:
        {{
            "title": "SEO-optimized title without colon",
            "description": "Meta description (155 characters max) without colon",
            "tags": list of relevant tags,
            "categories": primary categories for this blog,
            "body": body in markdown format
        }}

        Key requirements:
        1. Target website: cosmi.skin
        2. Title MUST be in one of these formats:
           - A direct question people ask themselves (e.g., "Is Retinol Safe During Pregnancy?")
           - A "How to" or "Why" question (e.g., "How to Remove Blackheads Without Damaging Your Skin?")
           - A "Which" or "What" comparison question (e.g., "Which Vitamin C Serum Works Best for Hyperpigmentation?")
           - An intriguing statement with a question mark (e.g., "Face Moisturizer and Body Lotion? They're Not the Same!")
        3. Tags should be relevant skincare keywords
        4. Categories should be broader classifications (e.g., "Skincare", "Product Reviews", "Ingredients")
        5. Body Formatting:
            - Strictly in **Markdown** format (use `#` for headings, `*` for bullet points, etc.).
            - **Do NOT** use JSON or any structured markup inside the body.
            - **Do NOT** use special characters like /u2019 instead use proper punctuation, etc.
            - **Ensure proper markdown hierarchy** with headings, subheadings, and lists where necessary.
        6. Include insights from Reddit comments

        Rules to follow while generating the blog:
        1. Do not use word 'Reddit' or Reddit users anywhere.
        Discussion content
        2. Blog should be SEO optimized.
        """
    
    def webSearchPrompt(self, content_for_prompt, query: str) -> str:
        return f"""
        Create a highly engaging, SEO-optimized blog post based on these web search results about "{query}": {content_for_prompt}.
        
        # Markdown Cheat Sheet 📜

        Markdown is a lightweight markup language for formatting text. Below are common elements you can use.

        ---

        ## 1. Headings
        ```markdown
        ## H2 Heading
        ### H3 Heading
        #### H4 Heading
        ##### H5 Heading
        ###### H6 Heading
        ** for bold

        Format the output as a JSON object with the following schema:
        {{
            "title": "Title formatted as a question people ask themselves or a compelling statement with question mark",
            "description": "Meta description (155 characters max) without colon that drives clicks",
            "tags": list of relevant SEO-optimized tags,
            "categories": primary categories for this blog,
            "body": body in markdown format
        }}

        Key requirements:
        1. Target website: cosmi.skin
        2. Title MUST be in one of these formats:
           - A direct question people ask themselves (e.g., "Is Retinol Safe During Pregnancy?")
           - A "How to" or "Why" question (e.g., "How to Remove Blackheads Without Damaging Your Skin?")
           - A "Which" or "What" comparison question (e.g., "Which Vitamin C Serum Works Best for Hyperpigmentation?")
           - An intriguing statement with a question mark (e.g., "Face Moisturizer and Body Lotion? They're Not the Same!")
        3. Tags should be highly relevant keywords for SEO
        4. Categories should be broader classifications
        5. Body Formatting:
            - Strictly in **Markdown** format (use `#` for headings, `*` for bullet points, etc.).
            - **Do NOT** use JSON or any structured markup inside the body.
            - **Do NOT** use special characters like /u2019 instead use proper punctuation, etc.
            - **Ensure proper markdown hierarchy** with headings, subheadings, and lists where necessary.
            - Include statistics, facts, and data from the search results
            - Add "secret tips" or "hidden knowledge" sections to drive engagement
        
        Rules to follow while generating the blog:
        1. Do not mention the search sources directly
        2. Blog should be extremely SEO optimized with keywords naturally placed
        3. Use emotional triggers in headings (e.g., "shocking," "surprising," "secret," "unknown")
        4. Create a sense of urgency or FOMO (fear of missing out)
        5. Include numbered lists like "7 Ways to..." or "5 Secrets About..."
        6. Use power words throughout the content
        7. Make sure the content delivers on the clickbait promise
        """
