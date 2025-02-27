
// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const adminPanel = document.getElementById('admin-panel');
const priceListSection = document.getElementById('price-list-section');
const cartSection = document.getElementById('cart-section');
const ordersSection = document.getElementById('orders-section');
const priceList = document.getElementById('price-list');
const cartItems = document.getElementById('cart-items');
const cartTotalAmount = document.getElementById('cart-total-amount');
const userOrders = document.getElementById('user-orders');
const adminOrders = document.getElementById('admin-orders');

// Auth state
let currentUser = null;
let isAdmin = false;

// Cart state
let cart = [];

// Show register form
document.getElementById('show-register').addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
});

// Show login form
document.getElementById('show-login').addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
});

// Register user
document.getElementById('register-btn').addEventListener('click', async () => {
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const adminCode = document.getElementById('admin-code').value;
  
  if (!username || !password) {
    alert('Please fill in all required fields');
    return;
  }
  
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, adminCode })
    });
    
    const data = await response.json();
    if (response.ok) {
      alert('Registration successful! Please login.');
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    } else {
      alert(data.error || 'Registration failed');
    }
  } catch (error) {
    alert('Registration failed. Please try again.');
  }
});

// Login user
document.getElementById('login-btn').addEventListener('click', async () => {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  if (!username || !password) {
    alert('Please fill in all fields');
    return;
  }
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (response.ok) {
      currentUser = username;
      isAdmin = data.isAdmin;
      updateAuthUI();
      loadItems();
      
      if (isAdmin) {
        loadAdminOrders();
      } else {
        loadUserOrders();
      }
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (error) {
    alert('Login failed. Please try again.');
  }
});

// Logout user
document.getElementById('logout-btn').addEventListener('click', () => {
  currentUser = null;
  isAdmin = false;
  cart = [];
  updateAuthUI();
  updateCartUI();
});

// Update UI based on auth state
function updateAuthUI() {
  if (currentUser) {
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    userInfo.classList.remove('hidden');
    usernameDisplay.textContent = currentUser;
    
    cartSection.classList.remove('hidden');
    ordersSection.classList.remove('hidden');
    
    if (isAdmin) {
      adminPanel.classList.remove('hidden');
    } else {
      adminPanel.classList.add('hidden');
    }
  } else {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    userInfo.classList.add('hidden');
    adminPanel.classList.add('hidden');
    cartSection.classList.add('hidden');
    ordersSection.classList.add('hidden');
  }
}

// Load items from API
async function loadItems() {
  try {
    const response = await fetch('/api/items');
    const items = await response.json();
    renderItems(items);
  } catch (error) {
    console.error('Failed to load items:', error);
  }
}

// Render items in price list
function renderItems(items) {
  priceList.innerHTML = '';
  
  items.forEach(item => {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    
    const imageHtml = item.imageUrl 
      ? `<img src="${item.imageUrl}" alt="${item.name}" class="item-image">`
      : `<div class="item-image-placeholder"></div>`;
    
    itemCard.innerHTML = `
      ${imageHtml}
      <div class="item-details">
        <h3>${item.name}</h3>
        <p>$${item.price.toFixed(2)} per ${item.unit}</p>
        
        ${currentUser ? `
          <div class="item-actions">
            <input type="number" min="1" value="1" class="quantity-input" id="qty-${item._id}">
            <button class="add-to-cart-btn" data-id="${item._id}" data-name="${item.name}" data-price="${item.price}" data-unit="${item.unit}">
              Add to Cart
            </button>
          </div>
          ${isAdmin ? `
            <div class="admin-item-actions">
              <button class="edit-item-btn" data-id="${item._id}">Edit</button>
              <button class="delete-item-btn" data-id="${item._id}">Delete</button>
            </div>
          ` : ''}
        ` : ''}
      </div>
    `;
    
    priceList.appendChild(itemCard);
  });
  
  // Add event listeners for add to cart buttons
  document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', addToCart);
  });
  
  // Add event listeners for admin actions
  if (isAdmin) {
    document.querySelectorAll('.edit-item-btn').forEach(button => {
      button.addEventListener('click', editItem);
    });
    
    document.querySelectorAll('.delete-item-btn').forEach(button => {
      button.addEventListener('click', deleteItem);
    });
  }
}

// Add item to cart
function addToCart(e) {
  const button = e.target;
  const id = button.getAttribute('data-id');
  const name = button.getAttribute('data-name');
  const price = parseFloat(button.getAttribute('data-price'));
  const unit = button.getAttribute('data-unit');
  const quantity = parseInt(document.getElementById(`qty-${id}`).value);
  
  if (quantity < 1) {
    alert('Please select a valid quantity');
    return;
  }
  
  // Check if item already in cart
  const existingItemIndex = cart.findIndex(item => item.id === id);
  
  if (existingItemIndex >= 0) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({ id, name, price, unit, quantity });
  }
  
  updateCartUI();
}

// Update cart UI
function updateCartUI() {
  cartItems.innerHTML = '';
  
  let total = 0;
  
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <div>
        <span>${item.name}</span>
        <span>(${item.quantity} ${item.unit} x $${item.price.toFixed(2)})</span>
      </div>
      <div>
        <span>$${itemTotal.toFixed(2)}</span>
        <button class="remove-from-cart" data-index="${index}">✕</button>
      </div>
    `;
    
    cartItems.appendChild(cartItem);
  });
  
  cartTotalAmount.textContent = total.toFixed(2);
  
  // Add event listeners for remove buttons
  document.querySelectorAll('.remove-from-cart').forEach(button => {
    button.addEventListener('click', removeFromCart);
  });
}

// Remove item from cart
function removeFromCart(e) {
  const index = parseInt(e.target.getAttribute('data-index'));
  cart.splice(index, 1);
  updateCartUI();
}

// Place order
document.getElementById('place-order-btn').addEventListener('click', async () => {
  if (!currentUser) {
    alert('Please login to place an order');
    return;
  }
  
  if (cart.length === 0) {
    alert('Your cart is empty');
    return;
  }
  
  try {
    const orderItems = cart.map(item => ({
      itemId: item.id,
      quantity: item.quantity
    }));
    
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'username': currentUser
      },
      body: JSON.stringify({ items: orderItems })
    });
    
    if (response.ok) {
      alert('Order placed successfully!');
      cart = [];
      updateCartUI();
      
      if (isAdmin) {
        loadAdminOrders();
      } else {
        loadUserOrders();
      }
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to place order');
    }
  } catch (error) {
    alert('Failed to place order. Please try again.');
  }
});

// Load user orders
async function loadUserOrders() {
  if (!currentUser) return;
  
  try {
    const response = await fetch('/api/orders', {
      headers: { 'username': currentUser }
    });
    
    const orders = await response.json();
    renderUserOrders(orders);
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
}

// Render user orders
function renderUserOrders(orders) {
  userOrders.innerHTML = '';
  
  if (orders.length === 0) {
    userOrders.innerHTML = '<p>No orders yet.</p>';
    return;
  }
  
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt).toLocaleString();
    
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    let itemsHtml = '';
    order.items.forEach(item => {
      itemsHtml += `
        <div class="order-item">
          <span>${item.itemId.name}</span>
          <span>${item.quantity} x $${item.price.toFixed(2)}</span>
        </div>
      `;
    });
    
    orderCard.innerHTML = `
      <div class="order-header">
        <div>Order ID: ${order._id}</div>
        <div>Date: ${orderDate}</div>
        <div class="order-status status-${order.status}">${order.status.toUpperCase()}</div>
      </div>
      <div class="order-items">
        ${itemsHtml}
      </div>
      <div class="order-total">Total: $${order.totalAmount.toFixed(2)}</div>
    `;
    
    userOrders.appendChild(orderCard);
  });
}

// Load admin orders
async function loadAdminOrders() {
  if (!currentUser || !isAdmin) return;
  
  try {
    const response = await fetch('/api/admin/orders', {
      headers: { 'username': currentUser }
    });
    
    const orders = await response.json();
    renderAdminOrders(orders);
  } catch (error) {
    console.error('Failed to load admin orders:', error);
  }
}

// Render admin orders
function renderAdminOrders(orders) {
  adminOrders.innerHTML = '';
  
  if (orders.length === 0) {
    adminOrders.innerHTML = '<p>No orders yet.</p>';
    return;
  }
  
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt).toLocaleString();
    
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    let itemsHtml = '';
    order.items.forEach(item => {
      itemsHtml += `
        <div class="order-item">
          <span>${item.itemId ? item.itemId.name : 'Unknown Item'}</span>
          <span>${item.quantity} x $${item.price.toFixed(2)}</span>
        </div>
      `;
    });
    
    let statusOptions = '';
    ['pending', 'confirmed', 'completed'].forEach(status => {
      statusOptions += `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status.toUpperCase()}</option>`;
    });
    
    orderCard.innerHTML = `
      <div class="order-header">
        <div>Order ID: ${order._id}</div>
        <div>User: ${order.user}</div>
        <div>Date: ${orderDate}</div>
        <div>
          <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
          <select class="status-select" data-id="${order._id}">
            ${statusOptions}
          </select>
          <button class="update-status" data-id="${order._id}">Update</button>
        </div>
      </div>
      <div class="order-items">
        ${itemsHtml}
      </div>
      <div class="order-total">Total: $${order.totalAmount.toFixed(2)}</div>
    `;
    
    adminOrders.appendChild(orderCard);
  });
  
  // Add event listeners for status updates
  document.querySelectorAll('.update-status').forEach(button => {
    button.addEventListener('click', updateOrderStatus);
  });
}

// Update order status
async function updateOrderStatus(e) {
  const button = e.target;
  const orderId = button.getAttribute('data-id');
  const select = document.querySelector(`.status-select[data-id="${orderId}"]`);
  const status = select.value;
  
  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'username': currentUser
      },
      body: JSON.stringify({ status })
    });
    
    if (response.ok) {
      alert('Order status updated successfully!');
      loadAdminOrders();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to update order status');
    }
  } catch (error) {
    alert('Failed to update order status. Please try again.');
  }
}

// Handle add item form submission
document.getElementById('add-item-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('name', document.getElementById('item-name').value);
  formData.append('price', document.getElementById('item-price').value);
  formData.append('unit', document.getElementById('item-unit').value);
  
  const imageFile = document.getElementById('item-image').files[0];
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  try {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'username': currentUser },
      body: formData
    });
    
    if (response.ok) {
      alert('Item added successfully!');
      document.getElementById('add-item-form').reset();
      loadItems();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to add item');
    }
  } catch (error) {
    alert('Failed to add item. Please try again.');
  }
});

// Edit item
async function editItem(e) {
  const id = e.target.getAttribute('data-id');
  
  // In a real app, you would open a modal form with the current item data
  alert('Edit functionality would be implemented with a form modal.');
}

// Delete item
async function deleteItem(e) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  
  const id = e.target.getAttribute('data-id');
  
  try {
    const response = await fetch(`/api/items/${id}`, {
      method: 'DELETE',
      headers: { 'username': currentUser }
    });
    
    if (response.ok) {
      alert('Item deleted successfully!');
      loadItems();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to delete item');
    }
  } catch (error) {
    alert('Failed to delete item. Please try again.');
  }
}

// Initialize app
loadItems();
updateAuthUI();
