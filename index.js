const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Authentication middleware
const authenticateUser = (req, res, next) => {
  const { username } = req.headers;
  if (!username) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.username = username;
  next();
};

const authenticateAdmin = async (req, res, next) => {
  const { username } = req.headers;
  if (!username) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const user = await User.findOne({ username });
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Authentication routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, adminCode } = req.body;
    const isAdmin = adminCode === 'ADMIN123'; // Simple admin code for demo purposes
    
    const user = new User({
      username,
      password, // In a real app, hash this password
      isAdmin
    });
    
    await user.save();
    res.status(201).json({ message: 'User registered successfully', isAdmin });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || user.password !== password) { // In a real app, compare hashed passwords
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ message: 'Login successful', isAdmin: user.isAdmin, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
});

// MongoDB connection using MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://your_atlas_username:your_atlas_password@cluster0.mongodb.net/priceListApp?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

// Item schema
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true }, // e.g., 'kg', 'pcs', etc.
  imageUrl: String,
  available: { type: Boolean, default: true }
});
const Item = mongoose.model('Item', itemSchema);

// Order schema
const orderSchema = new mongoose.Schema({
  user: { type: String, required: true }, // username
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true } // price at time of order
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'completed'] },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Add item (admin only)
app.post('/api/items', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    let imageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }
    
    const newItem = new Item({
      name: req.body.name,
      price: req.body.price,
      unit: req.body.unit,
      imageUrl: imageUrl,
      available: true
    });
    
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Get all items (public)
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Update item (admin only)
app.put('/api/items/:id', authenticateAdmin, async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item (admin only)
app.delete('/api/items/:id', authenticateAdmin, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Order routes
app.post('/api/orders', authenticateUser, async (req, res) => {
  try {
    const { items } = req.body;
    const orderItems = [];
    let totalAmount = 0;
    
    // Validate each item and calculate total
    for (const orderItem of items) {
      const item = await Item.findById(orderItem.itemId);
      if (!item || !item.available) {
        return res.status(400).json({ error: `Item ${orderItem.itemId} is not available` });
      }
      
      orderItems.push({
        itemId: item._id,
        quantity: orderItem.quantity,
        price: item.price
      });
      
      totalAmount += item.price * orderItem.quantity;
    }
    
    const newOrder = new Order({
      user: req.username,
      items: orderItems,
      totalAmount
    });
    
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user orders
app.get('/api/orders', authenticateUser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.username }).populate('items.itemId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get all orders (admin only)
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('items.itemId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status (admin only)
app.put('/api/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Start server
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});