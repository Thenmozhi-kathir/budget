/**
 * Budget Tracker Frontend
 * Connects to backend API and manages UI interactions
 */

// Configuration
const API_URL = 'http://localhost:5000/api';

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const typeSelect = document.getElementById('type');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const descriptionInput = document.getElementById('description');
const dateInput = document.getElementById('date');

const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const balanceEl = document.getElementById('balance');
const transactionsListEl = document.getElementById('transactionsList');
const suggestionsContainer = document.getElementById('suggestionsContainer');

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Budget Tracker Loaded');
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Load initial data
    loadSummary();
    loadTransactions();
    loadSuggestions();
    
    // Form submission
    transactionForm.addEventListener('submit', handleAddTransaction);
});

// ============================================
// FETCH SUMMARY (Income, Expenses, Balance)
// ============================================

async function loadSummary() {
    try {
        const response = await fetch(`${API_URL}/summary`);
        const data = await response.json();
        
        if (data.success) {
            totalIncomeEl.textContent = `₹${data.income.toFixed(2)}`;
            totalExpensesEl.textContent = `₹${data.expenses.toFixed(2)}`;
            
            const balanceValue = data.balance;
            balanceEl.textContent = `₹${balanceValue.toFixed(2)}`;
            
            // Color balance based on positive/negative
            if (balanceValue < 0) {
                balanceEl.style.color = '#ef4444';
            } else {
                balanceEl.style.color = '#f59e0b';
            }
        }
    } catch (error) {
        console.error('❌ Error loading summary:', error);
        showError('Failed to load summary');
    }
}

// ============================================
// FETCH TRANSACTIONS LIST
// ============================================

async function loadTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            transactionsListEl.innerHTML = '';
            
            data.data.forEach(transaction => {
                const transactionEl = createTransactionElement(transaction);
                transactionsListEl.appendChild(transactionEl);
            });
        } else {
            transactionsListEl.innerHTML = '<p>No transactions yet</p>';
        }
    } catch (error) {
        console.error('❌ Error loading transactions:', error);
        showError('Failed to load transactions');
    }
}

// ============================================
// CREATE TRANSACTION ELEMENT
// ============================================

function createTransactionElement(transaction) {
    const div = document.createElement('div');
    div.className = `transaction-item ${transaction.type} fade-in`;
    
    const isIncome = transaction.type === 'income';
    const amountPrefix = isIncome ? '+' : '-';
    const amountColor = isIncome ? 'green' : 'red';
    
    div.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-category">
                ${transaction.category}
            </div>
            <div class="transaction-details">
                ${transaction.description || 'No description'} • ${transaction.date}
            </div>
        </div>
        <div class="transaction-amount" style="color: ${isIncome ? '#10b981' : '#ef4444'}">
            ${amountPrefix}₹${transaction.amount.toFixed(2)}
        </div>
        <button class="btn btn-danger" onclick="deleteTransaction(${transaction.id})">
            Delete
        </button>
    `;
    
    return div;
}

// ============================================
// HANDLE ADD TRANSACTION
// ============================================

async function handleAddTransaction(e) {
    e.preventDefault();
    
    // Validate input
    if (!typeSelect.value || !amountInput.value) {
        showError('Please fill all required fields');
        return;
    }
    
    const newTransaction = {
        type: typeSelect.value,
        amount: parseFloat(amountInput.value),
        category: categorySelect.value,
        description: descriptionInput.value,
        date: dateInput.value
    };
    
    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTransaction)
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Transaction added');
            showSuccess('Transaction added successfully!');
            
            // Reset form
            transactionForm.reset();
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
            
            // Reload data
            loadSummary();
            loadTransactions();
            loadSuggestions();
        } else {
            showError(data.error || 'Failed to add transaction');
        }
    } catch (error) {
        console.error('❌ Error adding transaction:', error);
        showError('Failed to add transaction. Is backend running?');
    }
}

// ============================================
// DELETE TRANSACTION
// ============================================

async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Transaction deleted');
            loadSummary();
            loadTransactions();
            loadSuggestions();
        } else {
            showError(data.error || 'Failed to delete transaction');
        }
    } catch (error) {
        console.error('❌ Error deleting transaction:', error);
        showError('Failed to delete transaction');
    }
}

// ============================================
// LOAD SAVING SUGGESTIONS
// ============================================

async function loadSuggestions() {
    try {
        const response = await fetch(`${API_URL}/suggestions`);
        const data = await response.json();
        
        if (data.success && data.suggestions.length > 0) {
            suggestionsContainer.innerHTML = '';
            
            data.suggestions.forEach(suggestion => {
                const p = document.createElement('p');
                p.textContent = suggestion;
                p.style.marginBottom = '0.75rem';
                suggestionsContainer.appendChild(p);
            });
        }
    } catch (error) {
        console.error('❌ Error loading suggestions:', error);
    }
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}

// ============================================
// CHECK BACKEND CONNECTION
// ============================================

window.addEventListener('load', async () => {
    try {
        const response = await fetch(API_URL.replace('/api', ''));
        console.log('✅ Backend connected');
    } catch (error) {
        console.warn('⚠️ Backend not running. Make sure to run: python backend/app.py');
    }
});
