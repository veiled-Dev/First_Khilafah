document.addEventListener('DOMContentLoaded', function() {
    const SPACE_ID = 'lc1sul1czjfo';
    const ACCESS_TOKEN = 'nY0gbN_5v39lZGS_MCMFtxY_6ROEYrRhYsgIo_sOLn4';

    // --- Mobile Menu Logic ---
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            const isActive = mainNav.classList.toggle('active');
            menuToggle.textContent = isActive ? 'Close' : 'Menu';
            menuToggle.setAttribute('aria-expanded', isActive);
        });

        // Close mobile menu when clicking a link
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    mainNav.classList.remove('active');
                    menuToggle.textContent = 'Menu';
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
                if (mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    menuToggle.textContent = 'Menu';
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    // --- Utility Functions ---
    function getImageUrl(assetId, includes) {
        if (!assetId || !includes || !includes.Asset) return null;
        const asset = includes.Asset.find(a => a.sys.id === assetId);
        return asset ? `https:${asset.fields.file.url}?w=800&q=80` : null;
    }

    function extractText(richText) {
        if (!richText || !richText.content) return '';
        return richText.content
            .map(node => 
                node.content ? node.content.map(textNode => textNode.value || '').join('') : ''
            )
            .join('<br><br>');
    }

    // --- Fetch Gallery (Only runs on gallery.html) ---
    async function fetchGallery() {
        const container = document.getElementById('gallery-container');
        if (!container) return;

        try {
            const res = await fetch(
                `https://cdn.contentful.com/spaces/${SPACE_ID}/entries?access_token=${ACCESS_TOKEN}&content_type=galleryImage&include=1`
            );
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            container.innerHTML = '';

            if (!data.items || data.items.length === 0) {
                container.innerHTML = '<p class="loading-state">No gallery images available at this time.</p>';
                return;
            }

            data.items.forEach(item => {
                const title = item.fields.title || 'School Memory';
                const images = item.fields.image;

                const processImage = (imgAsset) => {
                    const url = getImageUrl(imgAsset.sys.id, data.includes);
                    if (url) {
                        const galleryItem = document.createElement('div');
                        galleryItem.className = 'gallery-item';
                        galleryItem.innerHTML = `
                            <img src="${url}" alt="${title}" loading="lazy">
                            <div class="gallery-overlay">${title}</div>
                        `;
                        container.appendChild(galleryItem);
                    }
                };

                if (Array.isArray(images)) {
                    images.forEach(processImage);
                } else if (images) {
                    processImage(images);
                }
            });
        } catch (error) {
            console.error('Error fetching gallery:', error);
            container.innerHTML = '<p class="loading-state">Unable to load gallery. Please try again later.</p>';
        }
    }

    // --- Fetch News (Home Page Limited to 3) ---
    async function fetchLatestNews() {
        const container = document.getElementById('news-container');
        if (!container) return;

        try {
            const res = await fetch(
                `https://cdn.contentful.com/spaces/${SPACE_ID}/entries?access_token=${ACCESS_TOKEN}&content_type=announcement&include=1&order=-sys.createdAt`
            );
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            
            if (!data.items || data.items.length === 0) {
                container.innerHTML = '<p>No announcements at this time.</p>';
                return;
            }

            const newsItems = data.items.slice(0, 3);
            container.innerHTML = '';

            newsItems.forEach(item => {
                const f = item.fields;
                const assetId = f.media && f.media[0] ? f.media[0].sys.id : null;
                const url = assetId ? getImageUrl(assetId, data.includes) : null;
                
                const article = document.createElement('article');
                article.className = 'news-item';
                
                const content = extractText(f.content);
                const preview = content.length > 200 ? content.substring(0, 200) + '...' : content;
                
                article.innerHTML = `
                    <h3>${f.title}</h3>
                    ${url ? `<img src="${url}" alt="${f.title}" class="news-image" loading="lazy">` : ''}
                    <p>${preview}</p>
                `;
                container.appendChild(article);
            });

            // Add "View All News" link if there are more than 3
            if (data.items.length > 3) {
                const linkWrapper = document.createElement('div');
                linkWrapper.style.textAlign = 'center';
                linkWrapper.style.marginTop = '20px';
                
                const link = document.createElement('a');
                link.href = "#news-heading";
                link.className = "cta-button";
                link.textContent = "View More Announcements";
                
                linkWrapper.appendChild(link);
                container.appendChild(linkWrapper);
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            container.innerHTML = '<p>Unable to load announcements. Please try again later.</p>';
        }
    }

    // Initialize functions
    fetchGallery();
    fetchLatestNews();
});