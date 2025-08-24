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
                showNotification(`${quotesToSync.length} quotes uploaded to server`, 'success'); // CHANGED THIS LINE
            } else {
                showNotification('Failed to upload quotes to server', 'error'); // CHANGED THIS LINE
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