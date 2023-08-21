const baseUrl = 'https://www.keysearch.co';


function objectToFormData(obj) {
    const formData = new FormData();
    Object.keys(obj).forEach(key => formData.append(key, obj[key]));
    return formData;
}

function makeRequest(endpoint, params) {
    return fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        body: objectToFormData(params)
    })
        .then(response => response.text())
        .catch(error => console.error('Error:', error));
}

function searchKeyword(keyword) {
    const params = {
        keyword: keyword,
        location: "all",
        search_type: "M",
        text_search: "search"
    };
    return makeRequest('/research/search', params);
}

function getFilter(keyword) {
    const params = {
        keyword: keyword,
        location: "all",
        search_type: "M",
        volume_start: 150,
        volume_end: "",
        cpc_start: "",
        cpc_end: "",
        keyword_start: "",
        keyword_end: "",
        keyword_to_filter: "",
        score_start: "",
        score_end: 29,
        negative: ""
    };
    return makeRequest('/research/get-filter', params);
}

function righttablemainresults(keyword) {
    const params = {
        keyword: keyword,
        location: "all",
        search_type: "M",
    };
    return makeRequest('/research/righttablemainresults', params);
}

function extractKeywordsFromHTML(htmlString) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlString, "text/html");
    const keywordElements = doc.querySelectorAll('.btn-info');
    const keywords = Array.from(keywordElements).map(el => el.textContent.trim());
    return keywords;
}

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'searchKeyword') {
        const keyword = request.keyword;
        searchKeyword(keyword)
            .then(data => {
                chrome.runtime.sendMessage({message: 'downloadData', data: data, filename: `${keyword}_search.html`, type: 'text/html'});
                return righttablemainresults(keyword);
            })
            .then(data => {
                chrome.runtime.sendMessage({message: 'downloadData', data: data, filename: `${keyword}_maintable.html`, type: 'text/html'});
                // Send raw HTML to the popup for parsing
                chrome.runtime.sendMessage({message: 'parseHTML', data: data});
                return getFilter(keyword);
            })
            .then(data => {
                chrome.runtime.sendMessage({message: 'downloadData', data: data, filename: `${keyword}_results.html`, type: 'text/html'});
            })
            .catch(error => console.error(error));
    }
});

