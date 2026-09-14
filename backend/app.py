"""
Budget Tracker Backend
Flask server handling income, expenses, and financial data
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow frontend to communicate with backend

# Database setup
DB_FILE = 'budget.db'

def init_db():
    """Create database tables if they don't exist"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Transactions table
    c.execute('''CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL
    )''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# ============================================
# API ENDPOINTS
# ============================================

@app.route('/')
def home():
    """Server status"""
    return jsonify({
        'status': 'Budget Tracker Backend Running ✅',
        'version': '1.0'
    })

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions"""
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM transactions ORDER BY date DESC')
        transactions = [dict(row) for row in c.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'data': transactions
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Add new income or expense"""
    try:
        data = request.json
        
        # Validate input
        if not data or 'type' not in data or 'amount' not in data:
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        c.execute('''INSERT INTO transactions (type, amount, category, description, date)
                     VALUES (?, ?, ?, ?, ?)''',
                  (data['type'], 
                   data['amount'],
                   data.get('category', 'Other'),
                   data.get('description', ''),
                   data.get('date', datetime.now().strftime('%Y-%m-%d'))))
        
        conn.commit()
        transaction_id = c.lastrowid
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Transaction added',
            'id': transaction_id
        }), 201
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Get income, expenses, and balance"""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        # Total income
        c.execute("SELECT SUM(amount) FROM transactions WHERE type='income'")
        total_income = c.fetchone()[0] or 0
        
        # Total expenses
        c.execute("SELECT SUM(amount) FROM transactions WHERE type='expense'")
        total_expenses = c.fetchone()[0] or 0
        
        # Balance
        balance = total_income - total_expenses
        
        conn.close()
        
        return jsonify({
            'success': True,
            'income': round(total_income, 2),
            'expenses': round(total_expenses, 2),
            'balance': round(balance, 2)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/suggestions', methods=['GET'])
def get_suggestions():
    """Get saving suggestions based on spending patterns"""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        # Get totals
        c.execute("SELECT SUM(amount) FROM transactions WHERE type='income'")
        total_income = c.fetchone()[0] or 0
        
        c.execute("SELECT SUM(amount) FROM transactions WHERE type='expense'")
        total_expenses = c.fetchone()[0] or 0
        
        conn.close()
        
        suggestions = []
        
        # Generate suggestions
        if total_income > 0:
            expense_ratio = total_expenses / total_income
            
            if expense_ratio > 0.8:
                suggestions.append("⚠️ You're spending 80%+ of income. Try to reduce expenses!")
            elif expense_ratio > 0.6:
                suggestions.append("💡 Consider saving more. Aim for 50-60% spending ratio.")
            else:
                suggestions.append("✅ Great! You're saving well. Keep it up!")
            
            savings = total_income - total_expenses
            if savings > 0:
                suggestions.append(f"💰 You can save ₹{savings:.2f} this month!")
            
            if total_income > 0:
                suggestions.append("📊 Try to automate your savings (set aside 10-20% of income).")
        
        return jsonify({
            'success': True,
            'suggestions': suggestions if suggestions else ["📈 Add transactions to get personalized suggestions!"]
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a transaction"""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('DELETE FROM transactions WHERE id = ?', (transaction_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Transaction deleted'})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# Run Server
# ============================================

if __name__ == '__main__':
    print("🚀 Budget Tracker Backend Starting...")
    print("📍 Server: http://localhost:5000")
    print("💾 Database: budget.db")
    app.run(debug=True, host='0.0.0.0', port=5000)
