document.addEventListener('DOMContentLoaded', () => {
    const radioLabels = document.querySelectorAll('.option-label');
    const radios = document.querySelectorAll('input[type="radio"]');
    const btn = document.getElementById('downloadBtn');
    const errorBox = document.getElementById('errorBox');

    // Handle radio button styling
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            radioLabels.forEach(label => label.classList.remove('active'));
            if (e.target.checked) {
                e.target.closest('.option-label').classList.add('active');
            }
        });
    });

    let isPaused = false;
    const pauseBtn = document.getElementById('pauseBtn');

    // Query active tab state to recover UI if popup was closed and reopened
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (tab && tab.url && tab.url.includes('cliffsnotes.com')) {
            chrome.tabs.sendMessage(tab.id, { action: "get_status" }, (response) => {
                if (chrome.runtime.lastError) return; // Script not injected yet
                
                if (response && response.isRunning) {
                    btn.innerText = "> Extracting... (Check Page)";
                    btn.disabled = true;
                    pauseBtn.style.display = 'block';
                    isPaused = response.isPaused;
                    pauseBtn.innerText = isPaused ? "> Resume_" : "> Pause_";
                }
            });
        }
    });

    pauseBtn.addEventListener('click', async () => {
        isPaused = !isPaused;
        pauseBtn.innerText = isPaused ? "> Resume_" : "> Pause_";
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: "toggle_pause", paused: isPaused });
    });

    btn.addEventListener('click', async () => {
        errorBox.style.display = 'none';
        
        const selectedFormat = document.querySelector('input[name="format"]:checked').value;
        
        btn.innerText = "> Extracting... (Check Page)";
        btn.disabled = true;
        pauseBtn.style.display = 'block';

        try {
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('cliffsnotes.com')) {
                throw new Error("This extension only works on CliffsNotes.com");
            }

            chrome.tabs.sendMessage(tab.id, { action: "start_download", format: selectedFormat });
            
        } catch (err) {
            if (err.message.includes('Receiving end does not exist') || err.message.includes('Could not establish connection')) {
                errorBox.innerText = "> Error: Please refresh this tab! The extension was just updated and hasn't loaded here yet.";
            } else {
                errorBox.innerText = `> Error: ${err.message}`;
            }
            errorBox.style.display = 'block';
            btn.innerText = "> Extract Now_";
            btn.disabled = false;
            pauseBtn.style.display = 'none';
        }
    });
});