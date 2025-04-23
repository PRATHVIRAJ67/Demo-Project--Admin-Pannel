import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import './MenuItems.css'; // Import the CSS file

// Initialize Supabase client - replace with your actual credentials
const supabaseUrl = 'https://azzfgtymixbbseinydfo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emZndHltaXhiYnNlaW55ZGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODY4NzgsImV4cCI6MjA2MDk2Mjg3OH0.klA9RjID-wT3FIrFaU1VLfhHl0RVKXg7CX3lcoIWf08';
const supabase = createClient(supabaseUrl, supabaseKey);

const MenuItems = () => {
  const navigate = useNavigate();
  
  // Function to handle back button click
  const handleBack = () => {
    navigate('/');
  };
  
  const [activeCategory, setActiveCategory] = useState('menu-starters');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [menuItems, setMenuItems] = useState({
    'menu-starters': [],
    'menu-breakfast': [],
    'menu-lunch': [],
    'menu-dinner': [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    img: '',
    days: [],
    category: 'menu-starters'
  });

  // Categories for the tabs
  const categories = [
    { id: 'menu-starters', label: 'Starters' },
    { id: 'menu-breakfast', label: 'Breakfast' },
    { id: 'menu-lunch', label: 'Lunch' },
    { id: 'menu-dinner', label: 'Dinner' },
  ];

  // Available days for checkboxes
  const availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Fetch menu items from Supabase on component mount
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      
      // Fetch all menu items from Supabase
      const { data, error } = await supabase
        .from('menu_items')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Organize items by category
      const itemsByCategory = {
        'menu-starters': [],
        'menu-breakfast': [],
        'menu-lunch': [],
        'menu-dinner': [],
      };
      
      // Process days from JSON string if needed and organize by category
      data.forEach(item => {
        // If days is stored as a string in Supabase, parse it
        if (typeof item.days === 'string') {
          item.days = JSON.parse(item.days);
        }
        
        // Add item to appropriate category
        if (itemsByCategory[item.category]) {
          itemsByCategory[item.category].push(item);
        }
      });
      
      setMenuItems(itemsByCategory);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setError('Failed to load menu items. Please try again later.');
      setLoading(false);
    }
  };

  // Function to insert initial data to Supabase (use once)
  const uploadInitialData = async () => {
    try {
      setLoading(true);

      const initialData = {
        
      };

      // Flatten the array to upload all items
      const allItems = Object.values(initialData).flat().map(item => {
        // Convert days array to string if Supabase requires it
        return {
          ...item,
          days: JSON.stringify(item.days)
        };
      });

      // Insert data into Supabase
      const { data, error } = await supabase
        .from('menu_items')
        .insert(allItems);

      if (error) {
        throw error;
      }

      alert('Initial data uploaded successfully!');
      // Refresh the items display
      fetchMenuItems();
    } catch (error) {
      console.error('Error uploading initial data:', error);
      alert('Failed to upload initial data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle menu item editing
  const handleEdit = (item) => {
    // Make a copy with days as an array (in case it's stored as a string in Supabase)
    const itemToEdit = {
      ...item,
      days: Array.isArray(item.days) ? item.days : JSON.parse(item.days)
    };
    setEditingItem(itemToEdit);
    setShowAddForm(true);
  };

  // Function to handle menu item deletion
  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        setLoading(true);
        
        // Delete item from Supabase
        const { error } = await supabase
          .from('menu_items')
          .delete()
          .eq('id', itemId);
        
        if (error) {
          throw error;
        }
        
        // Update local state
        const updatedItems = {...menuItems};
        updatedItems[activeCategory] = menuItems[activeCategory].filter(item => item.id !== itemId);
        setMenuItems(updatedItems);
        
        alert('Item deleted successfully!');
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Function to handle input change for new item
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingItem) {
      setEditingItem({...editingItem, [name]: value});
    } else {
      setNewItem({...newItem, [name]: value});
    }
  };

  // Function to handle checkbox change for days
  const handleDayChange = (day) => {
    if (editingItem) {
      const updatedDays = editingItem.days.includes(day)
        ? editingItem.days.filter(d => d !== day)
        : [...editingItem.days, day];
      setEditingItem({...editingItem, days: updatedDays});
    } else {
      const updatedDays = newItem.days.includes(day)
        ? newItem.days.filter(d => d !== day)
        : [...newItem.days, day];
      setNewItem({...newItem, days: updatedDays});
    }
  };

  // Function to add new item or update existing item
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingItem) {
        // Prepare item for update - stringify days array if needed
        const itemToUpdate = {
          ...editingItem,
          days: Array.isArray(editingItem.days) 
            ? JSON.stringify(editingItem.days) 
            : editingItem.days,
          category: activeCategory
        };
        
        // Update item in Supabase
        const { error } = await supabase
          .from('menu_items')
          .update(itemToUpdate)
          .eq('id', editingItem.id);
        
        if (error) {
          throw error;
        }
        
        alert('Item updated successfully!');
      } else {
        // Prepare new item for insertion
        const itemToAdd = {
          ...newItem,
          price: parseFloat(newItem.price),
          days: JSON.stringify(newItem.days),
          category: activeCategory
        };
        
        // Insert new item into Supabase
        const { error } = await supabase
          .from('menu_items')
          .insert(itemToAdd);
        
        if (error) {
          throw error;
        }
        
        // Reset new item form
        setNewItem({
          name: '',
          description: '',
          price: '',
          img: '',
          days: [],
          category: activeCategory
        });
        
        alert('New item added successfully!');
      }
      
      // Refresh the items display
      fetchMenuItems();
      setShowAddForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to change active category and reset form
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    if (!editingItem) {
      setNewItem({...newItem, category: categoryId});
    }
  };

  return (
    <div className="container">
      {/* Back button */}
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '20px' 
      }}>
        <button 
          className="back-button" 
          onClick={handleBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          ← Back to Home
        </button>
      </div>
      
      <h1 className="page-title"> Add or Edit Your Menu</h1>
      
      {/* Category tabs */}
      <div className="category-tabs">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`tab-button ${activeCategory === category.id ? 'active-tab' : ''}`}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Add new item button */}
      <div className="action-area">
        <button 
          className="add-button"
          onClick={() => {
            setEditingItem(null);
            setNewItem({
              name: '',
              description: '',
              price: '',
              img: '',
              days: [],
              category: activeCategory
            });
            setShowAddForm(!showAddForm);
          }}
          disabled={loading}
        >
          {showAddForm ? 'Cancel' : 'Add New Item'}
        </button>
      </div>

      {/* Display error message if any */}
      {error && <div className="error-message">{error}</div>}

      {/* Add/Edit form */}
      {showAddForm && (
        <div className="form-container">
          <h2 className="form-title">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name:</label>
              <input 
                type="text" 
                name="name" 
                value={editingItem ? editingItem.name : newItem.name} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Description:</label>
              <textarea 
                name="description" 
                value={editingItem ? editingItem.description : newItem.description} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Price ($):</label>
              <input 
                type="number" 
                name="price" 
                value={editingItem ? editingItem.price : newItem.price} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Image URL:</label>
              <input 
                type="text" 
                name="img" 
                value={editingItem ? editingItem.img : newItem.img} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Available Days:</label>
              <div className="checkbox-group">
                {availableDays.map(day => (
                  <label key={day} className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={editingItem ? editingItem.days.includes(day) : newItem.days.includes(day)} 
                      onChange={() => handleDayChange(day)} 
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
            
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
            </button>
          </form>
        </div>
      )}

      {/* Menu items table */}
      <div className="table-container">
        {loading && !showAddForm ? (
          <div className="loading-message">Loading menu items...</div>
        ) : (
          <table className="menu-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Available Days</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems[activeCategory] && menuItems[activeCategory].map(item => (
                <tr key={item.id}>
                  <td>
                    <img src={item.img} alt={item.name} className="item-image" />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.description}</td>
                  <td>₹{item.price.toFixed(2)}</td>

                  <td>{Array.isArray(item.days) ? item.days.join(', ') : JSON.parse(item.days).join(', ')}</td>
                  <td className="action-buttons">
                    <button 
                      className="edit-button" 
                      onClick={() => handleEdit(item)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button" 
                      onClick={() => handleDelete(item.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {menuItems[activeCategory].length === 0 && (
                <tr>
                  <td colSpan="6" className="no-items-message">
                    No items found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MenuItems;