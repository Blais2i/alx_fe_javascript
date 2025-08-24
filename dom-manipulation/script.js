// Array of quote objects with text and category properties
let quotes = [
    { id: 1, text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Work", version: 1 },
    { id: 2, text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon", category: "Life", version: 1 },
    { id: 3, text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Dreams", version: 1 },
    { id: 4, text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi", category: "Inspiration", version: 1 }
];

// Server simulation variables
let lastSyncTime = 0;
const SYNC_INTERVAL = 30000; // 30 seconds
let syncInterval;
let conflictQueue = [];

// DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const categoryFilter = document.getElementById('categoryFilter');
const syncStatus = document.getElementById('syncStatus');
const conflictNotification = document.getElementById('conflictNotification');
const conflictList = document.getElementById('conflictList');
const resolveConflictBtn = document.getElementById('resolveConflictBtn');
const manualSyncBtn = document.getElementById('manualSyncBtn');

// Load quotes from local storage
function loadQuotes() {
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
        quotes = JSON.parse(storedQuotes);
    }
    
    // Load last selected category filter
    const lastCategory = localStorage.getItem('lastCategory');
    if (lastCategory) {
        categoryFilter.value = lastCategory;
        filterQuotes();
    }
    
    // Load last sync time
    const storedSyncTime = localStorage.getItem('lastSyncTime');
    if (storedSyncTime) {
        lastSyncTime = parseInt(storedSyncTime);
    }
    
    updateSyncStatus();
    updateQuoteCount();
}

// Save quotes to local storage
function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    localStorage.setItem('lastSyncTime', lastSyncTime.toString());
    updateQuoteCount();
}

// Update quote count display
function updateQuoteCount() {
    const quoteCountElement = document.getElementById('quoteCount');
    if (quoteCountElement) {
        quoteCountElement.textContent = quotes.length;
    }
}

// Save last selected category to local storage
function saveLastCategory(category) {
    localStorage.setItem('lastCategory', category);
}

// Function to populate categories in the dropdown
function populateCategories() {
    // Clear existing options except the first one
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Get all unique categories
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
    // Add categories to the dropdown
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Function to filter quotes based on selected category
function filterQuotes() {
    const selectedCategory = categoryFilter.value;
    
    // Save the selected category to local storage
    saveLastCategory(selectedCategory);
    
    // Filter quotes based on selected category
    let filteredQuotes = selectedCategory === 'all' 
        ? quotes 
        : quotes.filter(quote => quote.category === selectedCategory);
    
    // Update the displayed quotes
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = '<p>No quotes found for this category.</p>';
    } else {
        // Display all filtered quotes
        quoteDisplay.innerHTML = '';
        filteredQuotes.forEach(quote => {
            const quoteElement = document.createElement('div');
            quoteElement.className = 'quote-item';
            quoteElement.innerHTML = `
                <p class="quote-text">"${quote.text}"</p>
                <p class="quote-author">- ${quote.author}</p>
                <span class="quote-category">${quote.category}</span>
                ${quote.conflict ? '<span class="conflict-badge">Conflict</span>' : ''}
            `;
            quoteDisplay.appendChild(quoteElement);
        });
    }
}

// Function to display a random quote
function showRandomQuote() {
    const selectedCategory = categoryFilter.value;
    let filteredQuotes = selectedCategory === 'all' 
        ? quotes 
        : quotes.filter(quote => quote.category === selectedCategory);
    
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = '<p>No quotes found for this category.</p>';
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    
    quoteDisplay.innerHTML = `
        <div class="quote-item">
            <p class="quote-text">"${randomQuote.text}"</p>
            <p class="quote-author">- ${randomQuote.author}</p>
            <span class="quote-category">${randomQuote.category}</span>
            ${randomQuote.conflict ? '<span class="conflict-badge">Conflict</span>' : ''}
        </div>
    `;
}

// Function to create the "Add Quote" form
function createAddQuoteForm() {
    const quoteForm = document.getElementById('addQuoteForm');
    const showFormButton = document.getElementById('showForm');
    
    // Toggle form visibility
    if (quoteForm.style.display === 'none') {
        quoteForm.style.display = 'block';
        showFormButton.textContent = 'Hide Form';
    } else {
        quoteForm.style.display = 'none';
        showFormButton.textContent = 'Add New Quote';
    }
}

// Function to add a new quote
function addQuote() {
    const newQuoteText = document.getElementById('newQuoteText').value;
    const newQuoteAuthor = document.getElementById('newQuoteAuthor').value;
    const newQuoteCategory = document.getElementById('newQuoteCategory').value;
    
    if (newQuoteText && newQuoteAuthor && newQuoteCategory) {
        // Add the new quote to the array
        const newQuote = {
            id: Date.now(), // Simple ID generation
            text: newQuoteText,
            author: newQuoteAuthor,
            category: newQuoteCategory,
            version: 1,
            local: true // Mark as local for sync
        };
        
        quotes.push(newQuote);
        
        // Save to local storage
        saveQuotes();
        
        // Clear the form
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteAuthor').value = '';
        document.getElementById('newQuoteCategory').value = '';
        
        // Hide the form
        document.getElementById('addQuoteForm').style.display = 'none';
        document.getElementById('showForm').textContent = 'Add New Quote';
        
        // Update categories
        populateCategories();
        
        // Show success message with notification
        showNotification('Quote added successfully!', 'success');
        
        // Trigger sync
        syncQuotes();
    } else {
        showNotification('Please fill in all fields.', 'error');
    }
}

// Show notification function
function showNotification(message, type = 'info') {
    // Remove any existing notification
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f44336';
    } else {
        notification.style.backgroundColor = '#2196F3';
    }
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to export quotes as JSON using Blob
function exportToJsonFile() {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quotes.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Quotes exported successfully!', 'success');
}

// Function to import quotes from JSON file
function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            
            // Validate the imported data
            if (Array.isArray(importedQuotes) && importedQuotes.every(q => q.text && q.author && q.category)) {
                // Add version and local flags
                const enhancedQuotes = importedQuotes.map(quote => ({
                    ...quote,
                    id: quote.id || Date.now() + Math.random(),
                    version: quote.version || 1,
                    local: true
                }));
                
                quotes.push(...enhancedQuotes);
                saveQuotes();
                populateCategories();
                showNotification(`Successfully imported ${importedQuotes.length} quotes!`, 'success');
                filterQuotes();
                
                // Trigger sync
                syncQuotes();
            } else {
                showNotification('Invalid JSON format. Please check the file structure.', 'error');
            }
        } catch (error) {
            showNotification('Error parsing JSON file: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = '';
}

// Simulate fetching quotes from server using JSONPlaceholder
async function fetchQuotesFromServer() {
    try {
        // Use JSONPlaceholder API as required
        const response = await fetch('https://jsonplaceholder.typicode.com/posts');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        
        // Convert posts to our quote format
        const serverQuotes = posts.slice(0, 5).map((post, index) => ({
            id: 100 + index, // Use IDs that won't conflict with local quotes
            text: post.title,
            author: `User ${post.userId}`,
            category: 'Server',
            version: 1,
            server: true // Mark as from server
        }));
        
        // Add a simulated update to an existing quote
        serverQuotes.push({
            id: 1,
            text: "The only way to do great work is to love what you do. (Server Updated)",
            author: "Steve Jobs",
            category: "Work",
            version: 2,
            server: true
        });
        
        return serverQuotes;
    } catch (error) {
        console.error('Failed to fetch from server:', error);
        // Fallback to mock data if fetch fails
        return [
            { id: 5, text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt", category: "Inspiration", version: 1, server: true },
            { id: 6, text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", category: "Perseverance", version: 1, server: true },
            { id: 1, text: "The only way to do great work is to love what you do. (Server Updated)", author: "Steve Jobs", category: "Work", version: 2, server: true }
        ];
    }
}

// Simulate posting quotes to server using JSONPlaceholder
async function postQuotesToServer(quotesToSync) {
    try {
        // Use JSONPlaceholder API as required
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            body: JSON.stringify(quotesToSync),
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Posted to server:', result);
        return { success: true, timestamp: Date.now() };
    } catch (error) {
        console.error('Failed to post to server:', error);
        return { success: false, error: error.message };
    }
}

// Sync with server
async function syncQuotes() {
    updateSyncStatus('Syncing...');
    showNotification('Syncing with server...', 'info');
    
    try {
        // Get local quotes that need to be synced
        const quotesToSync = quotes.filter(quote => quote.local);
        
        // Send local changes to server
        if (quotesToSync.length > 0) {
            const result = await postQuotesToServer(quotesToSync);
            if (result.success) {
                // Mark quotes as synced
                quotes.forEach(quote => {
                    if (quote.local) {
                        delete quote.local;
                    }
                });
                showNotification(`${quotesToSync.length} quotes synced to server`, 'success');
            } else {
                showNotification('Failed to sync quotes to server', 'error');
            }
        }
        
        // Fetch updates from server
        const serverQuotes = await fetchQuotesFromServer();
        let newQuotesCount = 0;
        let updatedQuotesCount = 0;
        
        // Merge server quotes with local quotes
        serverQuotes.forEach(serverQuote => {
            const localQuoteIndex = quotes.findIndex(q => q.id === serverQuote.id);
            
            if (localQuoteIndex === -1) {
                // New quote from server
                quotes.push(serverQuote);
                newQuotesCount++;
            } else {
                // Existing quote - check for conflicts
                const localQuote = quotes[localQuoteIndex];
                
                if (serverQuote.version > localQuote.version) {
                    // Server has newer version - update local
                    quotes[localQuoteIndex] = { ...serverQuote };
                    updatedQuotesCount++;
                } else if (serverQuote.version < localQuote.version && !localQuote.local) {
                    // Local has newer version - server should update (simulated)
                    console.log('Local has newer version, should update server');
                } else if (serverQuote.version === localQuote.version && 
                           JSON.stringify(serverQuote) !== JSON.stringify(localQuote)) {
                    // Conflict detected - same version but different content
                    quotes[localQuoteIndex].conflict = true;
                    conflictQueue.push({
                        local: { ...localQuote },
                        server: serverQuote,
                        id: localQuote.id
                    });
                }
            }
        });
        
        // Update last sync time
        lastSyncTime = Date.now();
        saveQuotes();
        
        // Update UI
        populateCategories();
        filterQuotes();
        updateSyncStatus();
        showConflicts();
        
        // Show sync summary
        if (newQuotesCount > 0 || updatedQuotesCount > 0) {
            showNotification(`Sync complete: ${newQuotesCount} new, ${updatedQuotesCount} updated quotes`, 'success');
        } else {
            showNotification('Sync complete: No new updates', 'info');
        }
        
    } catch (error) {
        console.error('Sync failed:', error);
        updateSyncStatus('Sync failed');
        showNotification('Sync failed: ' + error.message, 'error');
    }
}

// Update sync status UI
function updateSyncStatus(status) {
    if (!syncStatus) return;
    
    if (status) {
        syncStatus.textContent = status;
        syncStatus.className = 'sync-status syncing';
    } else {
        const lastSync = lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never';
        syncStatus.textContent = `Last sync: ${lastSync}`;
        syncStatus.className = 'sync-status';
    }
}

// Show conflicts in UI
function showConflicts() {
    if (!conflictNotification || !conflictList) return;
    
    if (conflictQueue.length > 0) {
        conflictNotification.style.display = 'block';
        conflictList.innerHTML = '';
        
        conflictQueue.forEach((conflict, index) => {
            const conflictItem = document.createElement('div');
            conflictItem.className = 'conflict-item';
            conflictItem.innerHTML = `
                <h4>Conflict #${index + 1}</h4>
                <p><strong>Local:</strong> "${conflict.local.text}" by ${conflict.local.author}</p>
                <p><strong>Server:</strong> "${conflict.server.text}" by ${conflict.server.author}</p>
            `;
            conflictList.appendChild(conflictItem);
        });
        
        showNotification(`${conflictQueue.length} conflicts detected`, 'error');
    } else {
        conflictNotification.style.display = 'none';
    }
}

// Resolve conflicts (always use server version for simplicity)
function resolveConflicts() {
    if (conflictQueue.length === 0) return;
    
    conflictQueue.forEach(conflict => {
        const quoteIndex = quotes.findIndex(q => q.id === conflict.id);
        if (quoteIndex !== -1) {
            // Use server version
            quotes[quoteIndex] = { ...conflict.server };
            delete quotes[quoteIndex].conflict;
        }
    });
    
    // Clear conflict queue
    const resolvedCount = conflictQueue.length;
    conflictQueue = [];
    
    // Update UI
    showConflicts();
    filterQuotes();
    saveQuotes();
    
    showNotification(`${resolvedCount} conflicts resolved`, 'success');
}

// Manual sync trigger
function manualSync() {
    syncQuotes();
}

// Start periodic syncing
function startSyncInterval() {
    syncInterval = setInterval(syncQuotes, SYNC_INTERVAL);
}

// Stop periodic syncing
function stopSyncInterval() {
    if (syncInterval) {
        clearInterval(syncInterval);
    }
}

// Event listeners
document.getElementById('newQuote').addEventListener('click', showRandomQuote);
document.getElementById('showForm').addEventListener('click', createAddQuoteForm);
document.getElementById('exportJson').addEventListener('click', exportToJsonFile);
document.getElementById('importFile').addEventListener('change', importFromJsonFile);
categoryFilter.addEventListener('change', filterQuotes);

if (resolveConflictBtn) {
    resolveConflictBtn.addEventListener('click', resolveConflicts);
}

if (manualSyncBtn) {
    manualSyncBtn.addEventListener('click', manualSync);
}

// Initialize the app
function init() {
    loadQuotes();
    populateCategories();
    filterQuotes();
    startSyncInterval();
}

// Call init when the page loads
window.onload = init;

// Clean up on page unload
window.addEventListener('beforeunload', stopSyncInterval);