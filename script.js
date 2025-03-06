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
  incomes.push({ description, amount });
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

  if (category !== 'uncategorized') {
    const budget = budgets.find(b => b.category === category);
    if (budget) {
      budget.remaining -= amount;
    }
  }

  expenses.push({ description, amount, category });
  saveData();
  updateSummary();
  updateHistory();
  updateBudgetList();
  e.target.reset();
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
    incomes[editIndex] = { description, amount };
  } else if (editType === 'Expense') {
    expenses[editIndex - incomes.length] = { description, amount, category };
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

// Update summary
function updateSummary() {
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalBudgetedExpenses = budgets.reduce((sum, budget) => sum + (budget.amount - budget.remaining), 0);
  const totalUncategorizedExpenses = expenses
    .filter(expense => expense.category === 'uncategorized')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const remainingBalance = totalIncome - totalBudgetedExpenses - totalUncategorizedExpenses;

  document.getElementById('total-income').textContent = totalIncome.toFixed(2);
  document.getElementById('total-budgeted-expenses').textContent = totalBudgetedExpenses.toFixed(2);
  document.getElementById('total-uncategorized-expenses').textContent = totalUncategorizedExpenses.toFixed(2);
  document.getElementById('remaining-balance').textContent = remainingBalance.toFixed(2);
}

// Update budget list
function updateBudgetList() {
  const budgetList = document.getElementById('budget-list');
  budgetList.innerHTML = budgets.map(budget => `
    <div class="budget-item">
      <strong>${budget.category}</strong>
      <p>Total: $${budget.amount.toFixed(2)} | Remaining: $${budget.remaining.toFixed(2)}</p>
      <div class="progress-bar">
        <div class="progress" style="width: ${(budget.remaining / budget.amount) * 100}%"></div>
      </div>
    </div>
  `).join('');
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
    addHistoryRow('Income', income.description, income.amount, '');
  });

  expenses.forEach(expense => {
    addHistoryRow('Expense', expense.description, expense.amount, expense.category);
  });
}

// Add a row to the history table
function addHistoryRow(type, description, amount, category) {
  const historyTable = document.getElementById('history-table').getElementsByTagName('tbody')[0];
  const row = historyTable.insertRow();
  row.innerHTML = `
    <td>${type}</td>
    <td>${description}</td>
    <td>${amount.toFixed(2)}</td>
    <td>${category}</td>
    <td class="actions">
      <button class="edit" onclick="editEntry(this)">Edit</button>
      <button onclick="deleteEntry(this)">Delete</button>
    </td>
  `;
}
