chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start_download") {
        window.isExtractionRunning = true;
        window.isExtractionPaused = false;
        runDocScraper(request.format);
        sendResponse({ success: true });
    } else if (request.action === "toggle_pause") {
        window.isExtractionPaused = request.paused;
        sendResponse({ success: true });
    } else if (request.action === "get_status") {
        sendResponse({ 
            isRunning: !!window.isExtractionRunning, 
            isPaused: !!window.isExtractionPaused 
        });
    }
});

async function waitIfPaused(indicator, originalText) {
    if (window.isExtractionPaused) {
        indicator.innerText = '> Paused_';
    }
    while (window.isExtractionPaused) {
        await new Promise(r => setTimeout(r, 500));
    }
    if (indicator.innerText === '> Paused_') {
        indicator.innerText = originalText;
    }
}

async function runDocScraper(format) {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; padding: 15px 25px; 
        background: #000000; color: #ffffff; font-family: "Courier New", Courier, monospace;
        font-size: 1.2rem; z-index: 999999; border: 1px solid #334155;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1px;
    `;
    indicator.innerText = '> Initializing active cleanup...';
    document.body.appendChild(indicator);

    const activeCleanup = setInterval(() => {
        document.querySelectorAll('div').forEach(div => {
            if (div.children.length === 0 && div.textContent.includes('Why is this page out of focus?')) {
                let banner = div.closest('.tw-w-4\\/5') || div.parentElement?.parentElement;
                if (banner) banner.remove();
            }
        });

        document.querySelectorAll('*').forEach(el => {
            if (el.style && (el.style.filter || el.style.backdropFilter)) {
                el.style.setProperty('filter', 'none', 'important');
                el.style.setProperty('backdrop-filter', 'none', 'important');
                el.style.setProperty('user-select', 'auto', 'important');
            }
        });
    }, 200);

    await new Promise((resolve) => {
        let lastHeight = document.body.scrollHeight;
        let retries = 0;
        
        let scrollTimer = setInterval(() => {
            if (window.isExtractionPaused) {
                indicator.innerText = '> Paused_';
                return;
            }
            indicator.innerText = '> Smooth scrolling to load all pages...';
            window.scrollBy(0, 300);
            let currentScroll = window.scrollY + window.innerHeight;
            let currentHeight = document.body.scrollHeight;

            if (currentHeight > lastHeight) {
                lastHeight = currentHeight;
                retries = 0; 
            }

            if (currentScroll >= currentHeight - 50) {
                retries++;
                if (retries >= 15) { 
                    clearInterval(scrollTimer);
                    window.scrollTo(0, 0);
                    setTimeout(resolve, 2500); 
                }
            }
        }, 400); 
    });
    
    indicator.innerText = '> Capturing pages...';

    let pages = document.querySelectorAll('.page-container');
    if (pages.length === 0) {
        pages = document.querySelectorAll('.doc-page, .document-page, article');
    }
    
    if (pages.length === 0) {
        indicator.innerText = '> Error: No pages found!';
        indicator.style.borderColor = '#ef4444';
        indicator.style.color = '#ef4444';
        window.isExtractionRunning = false;
        clearInterval(activeCleanup);
        setTimeout(() => indicator.remove(), 5000);
        return;
    }

    try {
        let capturedImages = [];
        for (let i = 0; i < pages.length; i++) {
            await waitIfPaused(indicator, `> Capturing page ${i + 1} of ${pages.length}...`);
            indicator.innerText = `> Capturing page ${i + 1} of ${pages.length}...`;
            
            let canvas = await html2canvas(pages[i], { scale: 1.5, useCORS: true, allowTaint: true, logging: false });
            let imgData = canvas.toDataURL('image/jpeg', 0.90); 
            capturedImages.push({ index: i, data: imgData });
        }

        if (format === 'pdf') {
            await waitIfPaused(indicator, '> Compiling PDF...');
            indicator.innerText = '> Compiling PDF...';
            const jsPDF = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
            const pdf = new jsPDF('p', 'mm', 'a4'); 
            const pdfWidth = pdf.internal.pageSize.getWidth();

            capturedImages.forEach((img, i) => {
                let imgProps = pdf.getImageProperties(img.data);
                let ratio = imgProps.width / imgProps.height;
                let renderHeight = pdfWidth / ratio;
                
                if (i > 0) pdf.addPage();
                pdf.addImage(img.data, 'JPEG', 0, 0, pdfWidth, renderHeight);
            });
            pdf.save('CliffsNotes_Document.pdf'); 

        } else if (format === 'zip') {
            await waitIfPaused(indicator, '> Creating ZIP file...');
            indicator.innerText = '> Creating ZIP file...';
            const zip = new window.JSZip();
            
            capturedImages.forEach((img) => {
                let base64Data = img.data.split(',')[1];
                let pageNum = String(img.index + 1).padStart(2, '0');
                zip.file(`Page_${pageNum}.jpg`, base64Data, {base64: true});
            });

            const content = await zip.generateAsync({type:"blob"});
            let link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "CliffsNotes_Images.zip";
            link.click();
        }

        indicator.style.borderColor = '#10b981';
        indicator.style.color = '#10b981';
        indicator.innerText = '> Download Complete!';
        
        window.isExtractionRunning = false;
        clearInterval(activeCleanup);
        setTimeout(() => indicator.remove(), 4000);

    } catch (error) {
        console.error(error);
        indicator.style.borderColor = '#ef4444';
        indicator.style.color = '#ef4444';
        indicator.innerText = `> Error: ${error.message}`;
        window.isExtractionRunning = false;
        clearInterval(activeCleanup);
        setTimeout(() => indicator.remove(), 6000);
    }
}