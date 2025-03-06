// Unique localStorage keys
const LS_PREFIX = "BudgetApp_";
const LS_INCOMES = LS_PREFIX + "incomes";
const LS_UTILITIES = LS_PREFIX + "utilities";
const LS_BUDGETS = LS_PREFIX + "budgets";
const LS_HISTORY = LS_PREFIX + "history"; // Unified history

// Data Arrays
let incomes = [], utilityExpenses = [], budgetCategories = [], history = [];

// Load Data
function loadData() {
    incomes = JSON.parse(localStorage.getItem(LS_INCOMES)) || [];
    utilityExpenses = JSON.parse(localStorage.getItem(LS_UTILITIES)) || [];
    budgetCategories = JSON.parse(localStorage.getItem(LS_BUDGETS)) || [];
    history = JSON.parse(localStorage.getItem(LS_HISTORY)) || [];
}

// Save Data
function saveData() {
    localStorage.setItem(LS_INCOMES, JSON.stringify(incomes));
    localStorage.setItem(LS_UTILITIES, JSON.stringify(utilityExpenses));
    localStorage.setItem(LS_BUDGETS, JSON.stringify(budgetCategories));
    localStorage.setItem(LS_HISTORY, JSON.stringify(history));
}

// Recalculate Totals
function recalculateTotals() {
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const totalUtility = utilityExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    let totalBudgetExpenses = 0;

    budgetCategories.forEach(cat => {
        cat.spent = cat.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        cat.remaining = cat.allocated - cat.spent;
        totalBudgetExpenses += cat.spent;
    });

    const totalExpenses = totalUtility + totalBudgetExpenses;
    const balance = totalIncome - totalExpenses;

    return { totalIncome, totalUtility, totalBudgetExpenses, totalExpenses, balance };
}

// Update UI
function updateUI() {
    const totals = recalculateTotals();

    document.getElementById("total-income").textContent = totals.totalIncome.toFixed(2);
    document.getElementById("total-expenses").textContent = totals.totalExpenses.toFixed(2);
    document.getElementById("balance").textContent = totals.balance.toFixed(2);

    // Update Budget Categories List
    const budgetsListEl = document.getElementById("budgets-list");
    budgetsListEl.innerHTML = budgetCategories.length === 0
        ? "<li class='empty'>No budgets set.</li>"
        : budgetCategories.map(cat => `
            <li>
                <div><strong>${cat.name}</strong></div>
                <div>Assigned: MVR ${cat.allocated.toFixed(2)}</div>
                <div>Used: MVR ${cat.spent.toFixed(2)}</div>
                <div>Remaining: MVR ${cat.remaining.toFixed(2)}</div>
                <div class="budget-bar-container">
                    <div class="budget-bar" style="width: ${Math.max((cat.remaining / cat.allocated) * 100, 0)}%"></div>
                </div>
                <button class="tiny-btn" onclick="editBudget(${cat.id})">✏</button>
                <button class="tiny-btn" onclick="deleteBudget(${cat.id})">🗑</button>
            </li>
        `).join("");

    // Update Budget Category Selection in Expense Form
    const expenseCategorySelect = document.getElementById("expense-category");
    expenseCategorySelect.innerHTML = budgetCategories.length
        ? budgetCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join("")
        : `<option disabled selected>No budgets available</option>`;

    // Update Activity History (Now Fully Functional)
    const historyListEl = document.getElementById("history-list");
    historyListEl.innerHTML = history.length === 0
        ? "<li class='empty'>No history records yet.</li>"
        : history.map(entry => `
            <li>
                <div>
                    <strong>${entry.type}</strong> - ${entry.desc}  
                    <br>Amount: <strong>MVR ${entry.amount.toFixed(2)}</strong>  
                    <br><small>${entry.timestamp}</small>
                </div>
                <button class="tiny-btn" onclick="deleteHistory(${entry.id})">🗑</button>
            </li>
        `).join("");

    saveData();
}

// Add Income
document.getElementById("income-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("income-amount").value);
    const desc = document.getElementById("income-desc").value.trim();

    if (!isNaN(amount) && amount > 0) {
        const newIncome = { id: Date.now(), type: "Income", amount, desc, timestamp: new Date().toLocaleString() };
        incomes.push(newIncome);
        history.push(newIncome);
        saveData();
        updateUI();
    }
});

// Add Utility Expense
document.getElementById("utility-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("utility-amount").value);
    const desc = document.getElementById("utility-desc").value.trim();

    if (!isNaN(amount) && amount > 0) {
        const newExpense = { id: Date.now(), type: "Utility Expense", amount, desc, timestamp: new Date().toLocaleString() };
        utilityExpenses.push(newExpense);
        history.push(newExpense);
        saveData();
        updateUI();
    }
});

// Add Budget Category
document.getElementById("budget-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const name = document.getElementById("budget-name").value.trim();
    const value = parseFloat(document.getElementById("budget-value").value);

    if (!isNaN(value) && value > 0) {
        const newBudget = {
            id: Date.now(),
            type: "Budget",
            name,
            allocated: value,
            spent: 0,
            remaining: value,
            expenses: [],
            desc: `Budget Created: ${name}`,
            timestamp: new Date().toLocaleString()
        };
        budgetCategories.push(newBudget);
        history.push(newBudget);
        saveData();
        updateUI();
    }
});

// Add Budget Expense
document.getElementById("budget-expense-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const budgetId = document.getElementById("expense-category").value;
    const amount = parseFloat(document.getElementById("expense-amount").value);
    const desc = document.getElementById("expense-desc").value.trim();

    if (!isNaN(amount) && amount > 0) {
        const budget = budgetCategories.find(b => b.id == budgetId);
        if (budget) {
            const newExpense = { id: Date.now(), type: "Budget Expense", amount, desc, timestamp: new Date().toLocaleString() };
            budget.expenses.push(newExpense);
            budget.spent += amount;
            budget.remaining -= amount;
            history.push({ ...newExpense, desc: `Expense in ${budget.name}: ${desc}` });
            saveData();
            updateUI();
        }
    }
});

// Delete History Entry
function deleteHistory(id) {
    history = history.filter(h => h.id !== id);
    saveData();
    updateUI();
}

// Initialize App
loadData();
updateUI();
