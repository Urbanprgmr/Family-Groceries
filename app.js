// app.js
let incomes = [];
let budgets = [];
let expenses = [];
let editIndex = null;
let editType = null;

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateSummary();
  updateHistory();
  updateBudgetList();
  updateExpenseCategories();
});

// Save data to local storage
function saveData() {
  localStorage.setItem('incomes', JSON.stringify(incomes));
  localStorage.setItem('budgets', JSON.stringify(budgets));
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Load data from local storage
function loadData() {
  incomes = JSON.parse(localStorage.getItem('incomes')) || [];
  budgets = JSON.parse(localStorage.getItem('budgets')) || [];
  expenses = JSON.parse(localStorage.getItem('expenses')) || [];
}

// Add income
document.getElementById('income-form').addEventListener('submit', addIncome);
function addIncome(e) {
  e.preventDefault();
  const description = document.getElementById('income-description').value;
  const amount = parseFloat(document.getElementById('income-amount').value);
  const timestamp = new Date().toLocaleString(); // Add timestamp
  incomes.push({ description, amount, timestamp });
  saveData();
  updateSummary();
  updateHistory();
  e.target.reset();
}

// Set budget
document.getElementById('budget-form').addEventListener('submit', setBudget);
function setBudget(e) {
  e.preventDefault();
  const category = document.getElementById('budget-category').value;
  const amount = parseFloat(document.getElementById('budget-amount').value);

  // Check if the budget category already exists
  const existingBudget = budgets.find(b => b.category === category);
  if (existingBudget) {
    alert('Budget category already exists. Please choose a different name.');
    return;
  }

  budgets.push({ category, amount, remaining: amount });
  saveData();
  updateBudgetList();
  updateExpenseCategories();
  e.target.reset();
}

// Add expense
document.getElementById('expense-form').addEventListener('submit', addExpense);
function addExpense(e) {
  e.preventDefault();
  const description = document.getElementById('expense-description').value;
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const timestamp = new Date().toLocaleString(); // Add timestamp

  if (category !== 'uncategorized') {
    const budget = budgets.find(b => b.category === category);
    if (budget) {
      budget.remaining -= amount;
    }
  }

  expenses.push({ description, amount, category, timestamp });
  saveData();
  updateSummary();
  updateHistory();
  updateBudgetList();
  e.target.reset();
}

// Edit budget
function editBudget(index) {
  const budget = budgets[index];
  const newCategory = prompt('Enter new category:', budget.category);
  const newAmount = parseFloat(prompt('Enter new amount:', budget.amount));

  if (newCategory && !isNaN(newAmount)) {
    budget.category = newCategory;
    budget.amount = newAmount;
    budget.remaining = newAmount - (budget.amount - budget.remaining);
    saveData();
    updateBudgetList();
    updateExpenseCategories();
  }
}

// Delete budget
function deleteBudget(index) {
  if (confirm('Are you sure you want to delete this budget?')) {
    budgets.splice(index, 1);
    saveData();
    updateBudgetList();
    updateExpenseCategories();
  }
}

// Update summary
function updateSummary() {
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalBudgetedExpenses = budgets.reduce((sum, budget) => sum + (budget.amount - budget.remaining), 0);
  const totalUncategorizedExpenses = expenses
    .filter(expense => expense.category === 'uncategorized')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const remainingBalance = totalIncome - totalBudgetedExpenses - totalUncategorizedExpenses;

  document.getElementById('total-income').textContent = `${totalIncome.toFixed(2)} MVR`;
  document.getElementById('total-budgeted-expenses').textContent = `${totalBudgetedExpenses.toFixed(2)} MVR`;
  document.getElementById('total-uncategorized-expenses').textContent = `${totalUncategorizedExpenses.toFixed(2)} MVR`;
  document.getElementById('remaining-balance').textContent = `${remainingBalance.toFixed(2)} MVR`;
}

// Update budget list
function updateBudgetList() {
  const budgetList = document.getElementById('budget-list');
  budgetList.innerHTML = budgets
    .map(
      (budget, index) => `
      <div class="budget-item">
        <h3>${budget.category}</h3>
        <p>Total: ${budget.amount.toFixed(2)} MVR</p>
        <p>Remaining: ${budget.remaining.toFixed(2)} MVR</p>
        <div class="progress-bar">
          <div class="progress" style="width: ${(budget.remaining / budget.amount) * 100}%"></div>
        </div>
        <div class="actions">
          <button class="edit" onclick="editBudget(${index})">Edit</button>
          <button class="delete" onclick="deleteBudget(${index})">Delete</button>
        </div>
      </div>
    `
    )
    .join('');
}

// Update expense categories dropdown
function updateExpenseCategories() {
  const expenseCategory = document.getElementById('expense-category');
  expenseCategory.innerHTML = '<option value="uncategorized">Uncategorized</option>' +
    budgets.map(budget => `<option value="${budget.category}">${budget.category}</option>`).join('');
}

// Update history table
function updateHistory() {
  const historyTable = document.getElementById('history-table').getElementsByTagName('tbody')[0];
  historyTable.innerHTML = '';

  incomes.forEach(income => {
    addHistoryRow('Income', income.description, income.amount, '', income.timestamp);
  });

  expenses.forEach(expense => {
    addHistoryRow('Expense', expense.description, expense.amount, expense.category, expense.timestamp);
  });
}

// Add a row to the history table
function addHistoryRow(type, description, amount, category, timestamp) {
  const historyTable = document.getElementById('history-table').getElementsByTagName('tbody')[0];
  const row = historyTable.insertRow();
  row.innerHTML = `
    <td>${type}</td>
    <td>${description}</td>
    <td>${amount.toFixed(2)} MVR</td>
    <td>${category}</td>
    <td>${timestamp}</td>
    <td class="actions">
      <button class="edit" onclick="editEntry(this)">Edit</button>
      <button onclick="deleteEntry(this)">Delete</button>
    </td>
  `;
}

// Edit entry
function editEntry(button) {
  const row = button.parentElement.parentElement;
  const index = row.rowIndex - 1; // Adjust for header row
  const type = row.cells[0].textContent;

  editIndex = index;
  editType = type;

  const modal = document.getElementById('edit-modal');
  const form = document.getElementById('edit-form');

  if (type === 'Income') {
    form.querySelector('#edit-description').value = incomes[index].description;
    form.querySelector('#edit-amount').value = incomes[index].amount;
    form.querySelector('#edit-category').style.display = 'none';
  } else if (type === 'Expense') {
    form.querySelector('#edit-description').value = expenses[index - incomes.length].description;
    form.querySelector('#edit-amount').value = expenses[index - incomes.length].amount;
    form.querySelector('#edit-category').value = expenses[index - incomes.length].category;
    form.querySelector('#edit-category').style.display = 'block';
  }

  modal.style.display = 'flex';
}

// Save edited entry
document.getElementById('edit-form').addEventListener('submit', saveEdit);
function saveEdit(e) {
  e.preventDefault();
  const description = document.getElementById('edit-description').value;
  const amount = parseFloat(document.getElementById('edit-amount').value);
  const category = document.getElementById('edit-category').value;

  if (editType === 'Income') {
    incomes[editIndex] = { description, amount, timestamp: incomes[editIndex].timestamp };
  } else if (editType === 'Expense') {
    expenses[editIndex - incomes.length] = { description, amount, category, timestamp: expenses[editIndex - incomes.length].timestamp };
  }

  saveData();
  updateSummary();
  updateHistory();
  updateBudgetList();
  closeModal();
}

// Close modal
document.querySelector('.close').addEventListener('click', closeModal);
function closeModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

// Delete entry
function deleteEntry(button) {
  const row = button.parentElement.parentElement;
  const index = row.rowIndex - 1; // Adjust for header row
  const type = row.cells[0].textContent;

  if (type === 'Income') {
    incomes.splice(index, 1);
  } else if (type === 'Expense') {
    expenses.splice(index - incomes.length, 1);
  }

  saveData();
  updateSummary();
  updateHistory();
  updateBudgetList();
}
