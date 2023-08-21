function downloadData(data, filename, type) {
    const file = new Blob([data], { type: type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
}

function displayQueue() {
    chrome.storage.local.get('keywordQueue', result => {
        const queue = result.keywordQueue || [];
        const queueElement = document.getElementById('keywordQueue');
        queueElement.innerHTML = '';  // Clear the existing queue display
        queue.forEach(keyword => {
            const li = document.createElement('li');
            li.textContent = keyword;
            li.style.cursor = 'pointer'; // Make it look clickable
            li.addEventListener('click', function () { // Add click event listener
                chrome.runtime.sendMessage({ message: 'searchKeyword', keyword: keyword });
            });
            queueElement.appendChild(li);
        });
    });
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'downloadData') {
        downloadData(request.data, request.filename, request.type);
    }
});

window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('searchForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const keyword = document.getElementById('keyword').value;
        chrome.runtime.sendMessage({ message: 'searchKeyword', keyword: keyword });
    });
    displayQueue();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'parseHTML') {
        const keywords = extractKeywordsFromHTML(request.data);
        addKeywordsToQueue(keywords);
    }
});

function extractKeywordsFromHTML(htmlString) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlString, "text/html");
    const keywordElements = doc.querySelectorAll('.btn-info');
    const keywords = Array.from(keywordElements).map(el => el.textContent.trim());
    console.log(`Found ${keywords.length} keywords \n${keywords.join('\n')}`)
    return keywords;
}


function clearKeywordQueue() {
    chrome.storage.local.clear(() => {
        console.log("Keyword queue cleared");
    });
}



document.getElementById('clearQueue').addEventListener('click', clearKeywordQueue);

function addKeywordsToQueue(keywords) {
    chrome.storage.local.get('keywordQueue', result => {
        const queue = result.keywordQueue || [];
        keywords.forEach(keyword => {
            if (!queue.includes(keyword)) {
                queue.push(keyword);
            }
        });
        chrome.storage.local.set({ keywordQueue: queue });
    });
}
