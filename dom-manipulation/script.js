// Array of quote objects with text and category properties
const quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Work" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" },
    { text: "Be the change that you wish to see in the world.", category: "Inspiration" },
    { text: "The only true wisdom is in knowing you know nothing.", category: "Wisdom" },
    { text: "In the middle of difficulty lies opportunity.", category: "Opportunity" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "Success" },
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "Perseverance" }
];

// Function to display a random quote
function showRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];
    
    const quoteDisplay = document.getElementById('quoteDisplay');
    quoteDisplay.innerHTML = `
        <p class="quote-text">"${randomQuote.text}"</p>
        <p class="quote-category">Category: ${randomQuote.category}</p>
    `;
}

// Function to create the add quote form
function createAddQuoteForm() {
    const form = document.getElementById('addQuoteForm');
    const toggleButton = document.getElementById('toggleFormButton');
    
    if (form.style.display === 'none') {
        form.style.display = 'block';
        toggleButton.textContent = 'Hide Add Quote Form';
    } else {
        form.style.display = 'none';
        toggleButton.textContent = 'Show Add Quote Form';
    }
}

// Function to add a new quote
function addQuote() {
    const newQuoteText = document.getElementById('newQuoteText').value;
    const newQuoteCategory = document.getElementById('newQuoteCategory').value;
    
    if (newQuoteText && newQuoteCategory) {
        // Add the new quote to the array
        quotes.push({
            text: newQuoteText,
            category: newQuoteCategory
        });
        
        // Clear the form
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteCategory').value = '';
        
        // Hide the form
        document.getElementById('addQuoteForm').style.display = 'none';
        document.getElementById('toggleFormButton').textContent = 'Show Add Quote Form';
        
        // Update category filters
        updateCategoryFilters();
        
        // Show success message
        alert('Quote added successfully!');
    } else {
        alert('Please fill in both fields.');
    }
}

// Function to update category filters
function updateCategoryFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<h3>Filter by Category:</h3>';
    
    // Get all unique categories
    const categories = ['All', ...new Set(quotes.map(quote => quote.category))];
    
    // Create filter buttons for each category
    categories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category;
        button.classList.add('category-btn');
        
        button.addEventListener('click', () => {
            if (category === 'All') {
                showRandomQuote();
            } else {
                // Filter quotes by category
                const filteredQuotes = quotes.filter(quote => quote.category === category);
                if (filteredQuotes.length > 0) {
                    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
                    const randomQuote = filteredQuotes[randomIndex];
                    
                    const quoteDisplay = document.getElementById('quoteDisplay');
                    quoteDisplay.innerHTML = `
                        <p class="quote-text">"${randomQuote.text}"</p>
                        <p class="quote-category">Category: ${randomQuote.category}</p>
                    `;
                }
            }
        });
        
        categoryFilter.appendChild(button);
    });
}

// Event listener for the "Show New Quote" button
document.getElementById('newQuote').addEventListener('click', showRandomQuote);

// Event listener for the toggle form button
document.getElementById('toggleFormButton').addEventListener('click', createAddQuoteForm);

// Initialize the application
function init() {
    showRandomQuote();
    updateCategoryFilters();
}

// Call init when the page loads
window.onload = init;