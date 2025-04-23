import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./DashboardStyles.css";
import { Link } from 'react-router-dom';

// Initialize Supabase client
const supabaseUrl = "https://nozzpehnfbukmptsnhoo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5venpwZWhuZmJ1a21wdHNuaG9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNjAzMzMsImV4cCI6MjA1OTkzNjMzM30.RaSvnadBrgrbWssM-HDpwiQZy8DUk7UJZPR3cBPLbdE";
const supabase = createClient(supabaseUrl, supabaseKey);

function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarClosed, setSidebarClosed] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    customers: 0
  });

  useEffect(() => {
    // Load user preferences from localStorage
    const getMode = localStorage.getItem("mode");
    if (getMode && getMode === "dark") {
      setDarkMode(true);
    }

    const getStatus = localStorage.getItem("status");
    if (getStatus && getStatus === "close") {
      setSidebarClosed(true);
    }

    // Initial data loading
    fetchOrders();
    fetchStats();

    // Set up real-time subscription for orders
    const ordersSubscription = supabase
      .channel('public:users')
      .on('INSERT', (payload) => {
        console.log('New order received!', payload);
        fetchOrders();
        fetchStats();
      })
      .on('UPDATE', (payload) => {
        console.log('Order updated!', payload);
        fetchOrders();
      })
      .on('DELETE', (payload) => {
        console.log('Order deleted!', payload);
        fetchOrders();
        fetchStats();
      })
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, []);

  // Fetch orders from Supabase
  const fetchOrders = async () => {
    try {
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Format data from Supabase to match our expected structure
      const formattedOrders = data.map(order => ({
        id: order.id,
        name: order.name,
        phone: order.phone,
        altPhone: order.altPhone,
        address: order.address,
        city: order.city,
        zip: order.zip,
        items: parseOrderItems(order.order_items),
        amount: formatCurrency(order.order_total),
        deliveryFee: formatCurrency(order.delivery_fee),
        orderedDate: formatDate(order.order_date),
        paymentId: order.payment_id,
        discount: order.discount,
        promoCode: order.promo_code,
        deliveryOption: order.delivery_option
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Fetch dashboard stats from Supabase
  const fetchStats = async () => {
    try {
      // Get total number of orders
      const { count: orderCount, error: orderError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (orderError) throw orderError;

      // Get total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('users')
        .select('order_total');
      
      if (revenueError) throw revenueError;
      
      const totalRevenue = revenueData.reduce((sum, order) => sum + (order.order_total || 0), 0);
      
      // Get unique customers count
      const { data: uniqueCustomers, error: customerError } = await supabase
        .from('users')
        .select('name')
        .limit(1000);
      
      if (customerError) throw customerError;
      
      const uniqueCustomerCount = new Set(uniqueCustomers.map(c => c.name)).size;

      setStats({
        totalOrders: orderCount,
        revenue: totalRevenue,
        customers: uniqueCustomerCount
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Parse order items from JSON format
  const parseOrderItems = (items) => {
    if (!items) return [];
    try {
      // If items is already a string, parse it
      if (typeof items === 'string') {
        items = JSON.parse(items);
      }
      
      // Ensure items is an array
      if (Array.isArray(items)) {
        return items.map(item => {
          return {
            id: item.id || 0,
            name: item.name || 'Unknown Item',
            quantity: item.quantity || 1,
            price: item.price || 0,
            description: item.description || '',
            img: item.img || '',
            days: item.days || []
          };
        });
      }
      return [];
    } catch (e) {
      console.error("Error parsing order items:", e, items);
      return [];
    }
  };

  // Format currency values
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0.00';
    return `₹${parseFloat(value).toFixed(2)}`;
  };
  

  // Format date strings
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return dateString;
    }
  };

  const handleModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("mode", newDarkMode ? "dark" : "light");
  };

  const handleSidebarToggle = () => {
    const newSidebarClosed = !sidebarClosed;
    setSidebarClosed(newSidebarClosed);
    localStorage.setItem("status", newSidebarClosed ? "close" : "open");
  };

  const handleViewOrder = (orderId) => {
    const order = orders.find(item => item.id === orderId);
    setSelectedOrder(selectedOrder?.id === orderId ? null : order);
  };

  // Filter data based on active tab
  const filteredOrders = activeTab === "all" 
    ? orders 
    : orders.filter(item => {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        if (activeTab === "today") {
          return item.orderedDate === today;
        } else if (activeTab === "week") {
          return item.orderedDate >= weekAgoStr;
        }
        return true;
      });

  return (
    <div className={`body ${darkMode ? "dark" : ""}`}>
      <nav className={sidebarClosed ? "close" : ""}>
        <div className="logo-name">
          <div className="logo-image">
            <img src="images/logo.png" alt="Logo" />
          </div>
          <span className="logo_name">Venkatalakhmi Mess</span>
        </div>

        <div className="menu-items">
          <ul className="nav-links">
          <li>
  <Link to ="/" className="active">
    <i className="uil uil-estate"></i>
    <span className="link-name">Dashboard</span>
  </Link>
</li>

<li>
<li>
  <Link to="/item" className="active">
    <i className="uil uil-shopping-bag"></i>
    <span className="link-name">Items</span>
  </Link>
</li>
</li>

            {/* <li>
              <a href="#">
                <i className="uil uil-users-alt"></i>
                <span className="link-name">Customers</span>
              </a>
            </li> */}
            {/* <li>
              <a href="#">
                <i className="uil uil-package"></i>
                <span className="link-name">Products</span>
              </a>
            </li> */}
            {/* <li>
              <a href="#">
                <i className="uil uil-chart"></i>
                <span className="link-name">Analytics</span>
              </a>
            </li>
            <li>
              <a href="#">
                <i className="uil uil-setting"></i>
                <span className="link-name">Settings</span>
              </a>
            </li> */}
          </ul>

          <ul className="logout-mode">
           

            <li className="mode">
              <a href="#" onClick={(e) => { e.preventDefault(); }}>
                <i className={`uil ${darkMode ? "uil-sun" : "uil-moon"}`}></i>
                <span className="link-name">Dark Mode</span>
              </a>

              <div className="mode-toggle" onClick={handleModeToggle}>
                <span className={`switch ${darkMode ? "active" : ""}`}></span>
              </div>
            </li>
          </ul>
        </div>
      </nav>

      <section className="dashboard">
        <div className="top">
          <i className="uil uil-bars sidebar-toggle" onClick={handleSidebarToggle}></i>
          
          {/* <div className="search-box">
            <i className="uil uil-search"></i>
            <input type="text" placeholder="Search orders, customers..." />
          </div> */}

          <div className="user-wrapper">
            <span className="user-name"></span>
            {/* <img src="images/profile.jpg" alt="Profile" /> */}
          </div>
        </div>

        <div className="dash-content">
          <div className="overview">
            <div className="title">
              <i className="uil uil-tachometer-fast"></i>
              <span className="text">Dashboard </span>
            </div>
            
            <div className="boxes">
              <div className="box box1">
                <i className="uil uil-shopping-cart"></i>
                <div className="box-content">
                  <span className="text">Total Orders</span>
                  <span className="number">{stats.totalOrders}</span>
                </div>
              </div>
              <div className="box box2">
                <i className="uil uil-wallet"></i>
                <div className="box-content">
                  <span className="text">Revenue</span>
                  <span className="number">{formatCurrency(stats.revenue)}</span>
                </div>
              </div>
              <div className="box box3">
                <i className="uil uil-users-alt"></i>
                <div className="box-content">
                  <span className="text">Customers</span>
                  <span className="number">{stats.customers}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="activity">
            <div className="title-filter-container">
              <div className="title">
                <i className="uil uil-clock-three"></i>
                <span className="text">Recent Orders</span>
              </div>
              
              <div className="filter-buttons">
                <button 
                  className={activeTab === "all" ? "active" : ""} 
                  onClick={() => setActiveTab("all")}
                >
                  All
                </button>
                <button 
                  className={activeTab === "today" ? "active" : ""} 
                  onClick={() => setActiveTab("today")}
                >
                  Today
                </button>
                <button 
                  className={activeTab === "week" ? "active" : ""} 
                  onClick={() => setActiveTab("week")}
                >
                  This Week
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Alt Phone</th>
                    <th>Address</th>
                    <th>City</th>
                    <th>Zip Code</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(item => (
                    <>
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.phone}</td>
                        <td>{item.altPhone}</td>
                        <td>{item.address}</td>
                        <td>{item.city}</td>
                        <td>{item.zip}</td>
                        <td>
                          <div className="item-count">
                            {item.items.length} item{item.items.length !== 1 ? 's' : ''}
                            <button 
                              className="view-items-btn"
                              onClick={() => handleViewOrder(item.id)}
                            >
                              <i className={`uil ${selectedOrder?.id === item.id ? 'uil-angle-up' : 'uil-angle-down'}`}></i>
                            </button>
                          </div>
                        </td>
                        <td>{item.amount}</td>
                        <td>{item.orderedDate}</td>
                      </tr>
                      {selectedOrder?.id === item.id && (
                        <tr className="item-details-row">
                          <td colSpan="9">
                            <div className="item-details-container">
                              <h4>Order Items</h4>
                              <div className="items-scroll-container">
                                <table className="items-table">
                                  <thead>
                                    <tr>
                                      <th>Item</th>
                                      <th>Description</th>
                                      <th>Price</th>
                                      <th>Quantity</th>
                                      <th>Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.items.map((orderItem, index) => (
                                      <tr key={index}>
                                        <td>{orderItem.name}</td>
                                        <td className="item-description">{orderItem.description}</td>
                                        <td>{orderItem.price.toFixed(2)}</td>
                                        <td>{orderItem.quantity}</td>
                                        <td>{(orderItem.price * orderItem.quantity).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="item-details-footer">
                                <div className="order-summary">
                                  <div>Subtotal: ₹{item.items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}</div>
                                  <div>Delivery Fee: {item.deliveryFee}</div>
                                  {item.discount > 0 && <div>Discount: {formatCurrency(item.discount)}</div>}
                                  <div className="order-total">Total: {item.amount}</div>
                                </div>
                                <div className="order-meta">
                                  <div>Payment ID: {item.paymentId}</div>
                                  {item.promoCode && <div>Promo Code: {item.promoCode}</div>}
                                  {item.deliveryOption && <div>Delivery Option: {item.deliveryOption}</div>}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredOrders.length === 0 && (
              <div className="no-data">
                <i className="uil uil-box"></i>
                <p>No orders found for the selected filter</p>
              </div>
            )}
            
            <div className="pagination">
              <button className="prev-btn" disabled>
                <i className="uil uil-angle-left"></i> Prev
              </button>
              <div className="page-numbers">
                <button className="active">1</button>
                <button>2</button>
                <button>3</button>
              </div>
              <button className="next-btn">
                Next <i className="uil uil-angle-right"></i>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;