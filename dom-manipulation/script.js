// Array of quote objects with text and category properties
let quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Work" },
    { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Dreams" },
    { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi", category: "Inspiration" }
];

// DOM elements
const quoteTextElement = document.getElementById('quoteText');
const quoteAuthorElement = document.getElementById('quoteAuthor');
const quoteCategoryElement = document.getElementById('quoteCategory');
const newQuoteButton = document.getElementById('newQuote');
const showFormButton = document.getElementById('showForm');
const quoteForm = document.getElementById('addQuoteForm');
const categoryFiltersContainer = document.getElementById('categoryFilters');
const exportJsonButton = document.getElementById('exportJson');
const quoteCountElement = document.getElementById('quoteCount');
const importFileInput = document.getElementById('importFile');
const categoryFilterSelect = document.getElementById('categoryFilter');

// Current category filter
let currentCategory = 'all';

// Load quotes from local storage
function loadQuotes() {
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
        quotes = JSON.parse(storedQuotes);
        updateQuoteCount();
    }
    
    // Load last viewed quote from session storage
    const lastQuote = sessionStorage.getItem('lastQuote');
    if (lastQuote) {
        const quote = JSON.parse(lastQuote);
        displayQuote(quote);
    }
    
    // Load last selected category filter
    const lastCategory = localStorage.getItem('lastCategory');
    if (lastCategory) {
        currentCategory = lastCategory;
        categoryFilterSelect.value = lastCategory;
        filterQuotes();
    }
}

// Save quotes to local storage
function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    updateQuoteCount();
}

// Update quote count display
function updateQuoteCount() {
    quoteCountElement.textContent = quotes.length;
}

// Save last viewed quote to session storage
function saveLastQuote(quote) {
    sessionStorage.setItem('lastQuote', JSON.stringify(quote));
}

// Save last selected category to local storage
function saveLastCategory(category) {
    localStorage.setItem('lastCategory', category);
}

// Display a quote
function displayQuote(quote) {
    quoteTextElement.textContent = `"${quote.text}"`;
    quoteAuthorElement.textContent = `- ${quote.author}`;
    quoteCategoryElement.textContent = quote.category;
    saveLastQuote(quote);
}

// Function to display a random quote
function showRandomQuote() {
    let filteredQuotes = currentCategory === 'all' 
        ? quotes 
        : quotes.filter(quote => quote.category.toLowerCase() === currentCategory);
    
    if (filteredQuotes.length === 0) {
        quoteTextElement.textContent = "No quotes found for this category.";
        quoteAuthorElement.textContent = "";
        quoteCategoryElement.textContent = "";
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    displayQuote(randomQuote);
}

// Function to create the "Add Quote" form
function createAddQuoteForm() {
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
        quotes.push({
            text: newQuoteText,
            author: newQuoteAuthor,
            category: newQuoteCategory
        });
        
        // Save to local storage
        saveQuotes();
        
        // Clear the form
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteAuthor').value = '';
        document.getElementById('newQuoteCategory').value = '';
        
        // Hide the form
        quoteForm.style.display = 'none';
        showFormButton.textContent = 'Add New Quote';
        
        // Update categories
        populateCategories();
        updateCategoryFilters();
        
        // Show a quote from the new category
        currentCategory = newQuoteCategory.toLowerCase();
        categoryFilterSelect.value = currentCategory;
        saveLastCategory(currentCategory);
        showRandomQuote();
        
        // Show success message
        alert('Quote added successfully!');
    } else {
        alert('Please fill in all fields.');
    }
}

// Function to update category filters
function updateCategoryFilters() {
    // Clear existing filters
    categoryFiltersContainer.innerHTML = '';
    
    // Get all unique categories
    const categories = ['all', ...new Set(quotes.map(quote => quote.category.toLowerCase()))];
    
    // Create filter buttons for each category
    categories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        button.classList.add('category-btn');
        if (category === currentCategory) {
            button.classList.add('active');
        }
        
        button.addEventListener('click', () => {
            currentCategory = category;
            categoryFilterSelect.value = category;
            saveLastCategory(category);
            // Update active button
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            // Show a quote from the selected category
            showRandomQuote();
        });
        
        categoryFiltersContainer.appendChild(button);
    });
}

// Function to populate categories in the dropdown
function populateCategories() {
    // Clear existing options except the first one
    while (categoryFilterSelect.options.length > 1) {
        categoryFilterSelect.remove(1);
    }
    
    // Get all unique categories
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
    // Add categories to the dropdown
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase();
        option.textContent = category;
        categoryFilterSelect.appendChild(option);
    });
    
    // Set the selected value
    categoryFilterSelect.value = currentCategory;
}

// Function to filter quotes based on selected category
function filterQuotes() {
    const selectedCategory = categoryFilterSelect.value;
    currentCategory = selectedCategory;
    saveLastCategory(selectedCategory);
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === selectedCategory) {
            btn.classList.add('active');
        }
    });
    
    showRandomQuote();
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
                quotes.push(...importedQuotes);
                saveQuotes();
                populateCategories();
                updateCategoryFilters();
                alert(`Successfully imported ${importedQuotes.length} quotes!`);
                showRandomQuote();
            } else {
                alert('Invalid JSON format. Please check the file structure.');
            }
        } catch (error) {
            alert('Error parsing JSON file: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = '';
}

// Event listeners
newQuoteButton.addEventListener('click', showRandomQuote);
showFormButton.addEventListener('click', createAddQuoteForm);
exportJsonButton.addEventListener('click', exportToJsonFile);
importFileInput.addEventListener('change', importFromJsonFile);
categoryFilterSelect.addEventListener('change', filterQuotes);

// Initialize the app
function init() {
    loadQuotes();
    populateCategories();
    updateCategoryFilters();
    showRandomQuote();
}

// Call init when the page loads
window.onload = init;