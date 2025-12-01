document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile Menu Logic (Keep this as is)
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            menuToggle.textContent = mainNav.classList.contains('active') ? 'Close' : 'Menu';
        });
    }

    // --- Contentful API Integration ---

    // The endpoint to fetch ALL entries of content type 'announcement'
    const CONTENTFUL_API_ENDPOINT = 
        'https://cdn.contentful.com/spaces/lc1sul1czjfo/entries?access_token=nY0gbN_5v39lZGS_MCMFtxY_6ROEYrRhYsgIo_sOLn4&content_type=announcement';
    
    // Utility to simplify Contentful's Rich Text (since simple news doesn't need complex rendering)
    function extractTextFromRichText(richText) {
        if (!richText || !richText.content) return '';
        // Simplistic extraction: join all paragraph text nodes
        return richText.content.map(node => 
            node.content.map(textNode => textNode.value).join('')
        ).join('<br><br>'); // Use breaks for paragraphs
    }

    // Utility to find the asset URL from the 'includes' object
    function getImageUrl(assetId, includes) {
        if (!assetId || !includes.Asset) return null;
        const asset = includes.Asset.find(a => a.sys.id === assetId);
        
        if (asset) {
            // ⭐ NEW: Add Contentful Image API parameters ⭐
            const originalUrl = asset.fields.file.url;
            // We want a max width of 600px, auto height, fit 'pad' (to maintain aspect ratio)
            // and good quality. Consider 'q=80' or 'q=70' for web performance.
            // Using 'fm=webp' is also a good modern optimization if supported.
            // However, starting simple with just size.
            return `https:${originalUrl}?w=600&h=350&fit=pad&q=75`; 
            // Adjust w (width), h (height), and q (quality) as needed
        }
        return null;
    }

    async function fetchLatestNews() {
        const container = document.getElementById('news-container');
        if (!container) return;

        try {
            const response = await fetch(CONTENTFUL_API_ENDPOINT);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json(); 
            const newsItems = data.items || [];
            const includes = data.includes || {}; // Contains assets (images)

            container.innerHTML = ''; 

            if (newsItems.length === 0) {
                container.innerHTML = '<p>No announcements available at this time.</p>';
                return;
            }

            // Loop through the content and create HTML for each item
            newsItems.forEach(item => {
                const fields = item.fields;
                
                const title = fields.title || 'Untitled Announcement'; 
                // Use the utility function for content
                const content = extractTextFromRichText(fields.content); 
                
                // Get the linked Asset ID if available
                const assetLink = fields.media && fields.media[0] ? fields.media[0].sys.id : null;
                // Use the utility function to resolve the image URL
                const imageUrl = getImageUrl(assetLink, includes);
                
                const date = fields.date ? new Date(fields.date).toLocaleDateString() : '';

                const article = document.createElement('article');
                article.classList.add('news-item');
                
                let articleHTML = `<h3>${title} <small>(${date})</small></h3>`;
                
                if (imageUrl) {
                    articleHTML += `<img src="${imageUrl}" alt="Image for ${title}" class="news-image">`;
                }

                articleHTML += `<p>${content}</p>`;
                
                article.innerHTML = articleHTML;
                container.appendChild(article);
            });

        } catch (error) {
            console.error('Failed to fetch news:', error);
            container.innerHTML = '<p class="error-message">Could not load announcements. Please check your CMS endpoint and network connection.</p>';
        }
    }

    fetchLatestNews();
});