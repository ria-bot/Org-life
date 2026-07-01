import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [weeklyBudget, setWeeklyBudget] = useState(10000); // Default KES
  const [weeklySpending, setWeeklySpending] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryBudget, setNewCategoryBudget] = useState("");

  useEffect(() => {
    fetchHomeData();
  }, []);

  async function fetchHomeData() {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);

      // Get this week's expenses
      const expenses = await api.getExpenses();
      const thisWeek = getThisWeekExpenses(expenses);
      setWeeklySpending(thisWeek);

      // Get categories (from expenses)
      const categoryList = getCategoryList(expenses);
      setCategories(categoryList);

      // Load saved weekly budget
      const savedBudget = localStorage.getItem('orglife_weekly_budget');
      if (savedBudget) {
        setWeeklyBudget(parseFloat(savedBudget));
      }

    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('401')) {
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  }

  // Get expenses from this week
  function getThisWeekExpenses(expenses) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)

    return expenses
      .filter(e => {
        const expenseDate = new Date(e.expense_date);
        return expenseDate >= startOfWeek && expenseDate <= now;
      })
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  }

  // Get unique categories from expenses
  function getCategoryList(expenses) {
    const categoryMap = {};
    
    expenses.forEach(e => {
      if (!categoryMap[e.category]) {
        categoryMap[e.category] = {
          name: e.category,
          total: 0,
          count: 0
        };
      }
      categoryMap[e.category].total += parseFloat(e.amount);
      categoryMap[e.category].count += 1;
    });

    return Object.values(categoryMap).sort((a, b) => b.total - a.total);
  }

  // Calculate spending percentage
  const spendingPercentage = Math.min((weeklySpending / weeklyBudget) * 100, 100);
  const isOverBudget = weeklySpending > weeklyBudget;
  const remaining = weeklyBudget - weeklySpending;

  // Handle budget update
  function handleBudgetUpdate(e) {
    const newBudget = parseFloat(e.target.value);
    setWeeklyBudget(newBudget);
    localStorage.setItem('orglife_weekly_budget', newBudget);
  }

  // Handle add category
  function handleAddCategory() {
    if (!newCategory.trim() || !newCategoryBudget) {
      alert("Please fill in both category name and budget");
      return;
    }

    const categoryData = {
      name: newCategory.trim(),
      budget: parseFloat(newCategoryBudget)
    };

    // Save to localStorage for now (backend integration later)
    const savedCategories = JSON.parse(localStorage.getItem('orglife_categories') || '[]');
    savedCategories.push(categoryData);
    localStorage.setItem('orglife_categories', JSON.stringify(savedCategories));

    // Update state
    setCategories([...categories, { 
      name: categoryData.name, 
      total: 0, 
      count: 0,
      budget: categoryData.budget
    }]);

    setNewCategory("");
    setNewCategoryBudget("");
    setShowAddCategory(false);
  }

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loader"></div>
        <p>Loading your home...</p>
      </div>
    );
  }

  return (
    <div className="home">
      {/* ===== TOP SECTION: Weekly Budget ===== */}
      <section className="weekly-section">
        <div className="weekly-header">
          <div>
            <h2 className="weekly-title">📅 This Week's Budget</h2>
            <p className="weekly-subtitle">
              {user?.full_name?.split(' ')[0] || 'User'}, here's your spending progress
            </p>
          </div>
          <div className="budget-input-group">
            <label>Weekly Budget</label>
            <input
              type="number"
              value={weeklyBudget}
              onChange={handleBudgetUpdate}
              className="budget-input"
            />
            <span className="budget-currency">{user?.currency || 'KES'}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-info">
            <span className="progress-label">Spent</span>
            <span className="progress-amount">
              {user?.currency || 'KES'} {weeklySpending.toFixed(2)}
            </span>
            <span className="progress-divider">/</span>
            <span className="progress-total">
              {user?.currency || 'KES'} {weeklyBudget.toFixed(2)}
            </span>
            <span className={`progress-status ${isOverBudget ? 'over' : 'under'}`}>
              {isOverBudget ? '⚠️ Over Budget' : '✅ On Track'}
            </span>
          </div>

          <div className="progress-bar-container">
            <div 
              className={`progress-bar ${isOverBudget ? 'over' : 'under'}`}
              style={{ width: `${Math.min(spendingPercentage, 100)}%` }}
            />
          </div>

          <div className="progress-remaining">
            {isOverBudget ? (
              <span className="over-text">
                ⚠️ You've exceeded your budget by {user?.currency || 'KES'} {Math.abs(remaining).toFixed(2)}
              </span>
            ) : (
              <span className="under-text">
                ✅ You have {user?.currency || 'KES'} {remaining.toFixed(2)} remaining
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ===== BOTTOM SECTION: Categories ===== */}
      <section className="categories-section">
        <div className="categories-header">
          <h2 className="categories-title">📂 Your Categories</h2>
          <button 
            className="add-category-btn"
            onClick={() => setShowAddCategory(!showAddCategory)}
          >
            {showAddCategory ? '✕ Cancel' : '+ Add Category'}
          </button>
        </div>

        {/* Add Category Form */}
        {showAddCategory && (
          <div className="add-category-form">
            <input
              type="text"
              placeholder="Category name (e.g., Food)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="category-input"
            />
            <input
              type="number"
              placeholder="Weekly budget (e.g., 5000)"
              value={newCategoryBudget}
              onChange={(e) => setNewCategoryBudget(e.target.value)}
              className="category-input"
            />
            <button 
              className="save-category-btn"
              onClick={handleAddCategory}
            >
              Save Category
            </button>
          </div>
        )}

        {/* Categories List */}
        <div className="categories-grid">
          {categories.length === 0 ? (
            <div className="empty-categories">
              <p>No categories yet.</p>
              <p className="empty-hint">Add your first category to start tracking!</p>
            </div>
          ) : (
            categories.map((category, index) => (
              <div key={index} className="category-card">
                <div className="category-icon">
                  {getCategoryIcon(category.name)}
                </div>
                <div className="category-info">
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-details">
                    {category.count} transaction{category.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="category-amount">
                  <span className="category-total">
                    {user?.currency || 'KES'} {category.total.toFixed(2)}
                  </span>
                  {category.budget && (
                    <span className="category-budget">
                      Budget: {user?.currency || 'KES'} {category.budget.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="category-progress">
                  <div 
                    className="category-progress-bar"
                    style={{ 
                      width: category.budget ? 
                        `${Math.min((category.total / category.budget) * 100, 100)}%` : 
                        '0%',
                      background: category.budget && category.total > category.budget ? 
                        '#c44a3a' : '#2a6a4a'
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

// Helper: Get icon for category
function getCategoryIcon(category) {
  const icons = {
    'Food': '🍔',
    'Transport': '🚗',
    'Rent': '🏠',
    'Utilities': '💡',
    'Entertainment': '🎮',
    'Shopping': '🛍️',
    'Health': '🏥',
    'Education': '📚',
    'Travel': '✈️',
    'Insurance': '🛡️',
    'Savings': '🏦',
    'Salary': '💰',
    'Freelance': '💻',
    'Business': '📈',
    'Other': '📦'
  };
  return icons[category] || '📦';
}