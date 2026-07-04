import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Categories.css";

export default function Categories() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [uncategorized, setUncategorized] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategorize, setShowCategorize] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchUserAndCategories();
  }, [selectedMonth]);

  async function fetchUserAndCategories() {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      await fetchCategories();
      await fetchUncategorized();
    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('401')) {
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const data = await api.getCategorySummary(selectedMonth);
      
      const sorted = data
        .sort((a, b) => b.total_amount - a.total_amount)
        .map((item, index) => ({
          ...item,
          rank: index + 1,
          total_amount: parseFloat(item.total_amount)
        }));
      
      setCategories(sorted);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchUncategorized() {
    try {
      const data = await api.getUncategorized();
      setUncategorized(data);
    } catch (error) {
      console.error('Error fetching uncategorized:', error);
    }
  }

  // Start the categorization workflow
  function startCategorizing() {
    setCurrentIndex(0);
    setShowCategorize(true);
  }

  // Categorize current transaction and move to next
  async function handleCategorizeCurrent(category) {
    const currentTransaction = uncategorized[currentIndex];
    if (!currentTransaction) return;

    try {
      await api.categorizeTransaction(currentTransaction.id, category);
      
      // Remove from uncategorized list
      const updated = uncategorized.filter((_, index) => index !== currentIndex);
      setUncategorized(updated);
      
      // If there are more transactions, stay on same index (which now points to next)
      if (updated.length > 0 && currentIndex < updated.length) {
        // Keep current index
      } else if (updated.length > 0) {
        // If we removed the last one, go back one
        setCurrentIndex(Math.min(currentIndex, updated.length - 1));
      } else {
        // All done!
        setShowCategorize(false);
        // Refresh categories
        await fetchCategories();
        alert('🎉 All transactions categorized!');
        return;
      }
      
      // Refresh the list
      await fetchCategories();
    } catch (error) {
      console.error('Error categorizing:', error);
      alert('Failed to categorize: ' + error.message);
    }
  }

  // Skip current transaction (move to next without categorizing)
  function handleSkip() {
    if (currentIndex < uncategorized.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // If this is the last one, close the modal
      setShowCategorize(false);
      alert('📋 You skipped some transactions. You can categorize them later.');
    }
  }

  // Close the categorization modal
  function handleClose() {
    if (uncategorized.length > 0 && currentIndex < uncategorized.length) {
      if (window.confirm(`You have ${uncategorized.length - currentIndex} transactions left to categorize. Are you sure you want to quit?`)) {
        setShowCategorize(false);
      }
    } else {
      setShowCategorize(false);
    }
  }

  // Get medal emoji based on rank
  function getMedal(rank) {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  }

  // Get medal class for podium styling
  function getMedalClass(rank) {
    switch(rank) {
      case 1: return 'gold';
      case 2: return 'silver';
      case 3: return 'bronze';
      default: return 'regular';
    }
  }

  // Get rank label
  function getRankLabel(rank) {
    switch(rank) {
      case 1: return '🏆 Champion';
      case 2: return '🥈 Runner Up';
      case 3: return '🥉 Third Place';
      default: return `#${rank}`;
    }
  }

  // Calculate total spending for percentage
  const totalSpending = categories.reduce((sum, cat) => sum + cat.total_amount, 0);

  // Get top 3 for podium
  const top3 = categories.slice(0, 3);
  const rest = categories.slice(3);

  // Handle month change
  function handleMonthChange(e) {
    setSelectedMonth(e.target.value);
  }

  // Get month name
  function getMonthName(monthStr) {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  // Get current transaction for categorization
  const currentTransaction = uncategorized[currentIndex];

  if (loading) {
    return (
      <div className="categories-loading">
        <div className="loader"></div>
        <p>Loading category rankings...</p>
      </div>
    );
  }

  return (
    <div className="categories-page">
      {/* Header */}
      <div className="categories-header">
        <div>
          <h1 className="categories-title">🏆 Category Rankings</h1>
          <p className="categories-subtitle">See where your money goes</p>
        </div>
        <div className="header-actions">
          {/* Categorize Button */}
          {uncategorized.length > 0 && (
            <button 
              className="categorize-btn"
              onClick={startCategorizing}
            >
              📋 Categorize ({uncategorized.length} pending)
            </button>
          )}
          <div className="month-selector">
            <label>Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="categories-stats">
        <div className="stat-card">
          <span className="stat-label">Total Spent</span>
          <span className="stat-value">{user?.currency || 'KES'} {totalSpending.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Categories</span>
          <span className="stat-value">{categories.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Month</span>
          <span className="stat-value">{getMonthName(selectedMonth)}</span>
        </div>
        {uncategorized.length > 0 && (
          <div className="stat-card warning">
            <span className="stat-label">Uncategorized</span>
            <span className="stat-value">{uncategorized.length}</span>
          </div>
        )}
      </div>

      {/* ===== CATEGORIZATION MODAL ===== */}
      {showCategorize && currentTransaction && (
        <div className="categorize-modal-overlay">
          <div className="categorize-modal">
            {/* Progress */}
            <div className="modal-progress">
              <span className="progress-text">
                {currentIndex + 1} / {uncategorized.length}
              </span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${((currentIndex + 1) / uncategorized.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Close Button */}
            <button className="modal-close" onClick={handleClose}>✕</button>

            {/* Transaction Card */}
            <div className="transaction-card">
              <div className="card-amount">
                {user?.currency || 'KES'} {parseFloat(currentTransaction.amount).toFixed(2)}
              </div>
              <div className="card-date">
                📅 {new Date(currentTransaction.created_at).toLocaleDateString()}
              </div>
              <div className="card-description">
                {currentTransaction.description || 'No description'}
              </div>
              <div className="card-hint">
                Select a category for this transaction
              </div>
            </div>

            {/* Category Selection Grid */}
            <div className="category-grid">
              <button 
                className="category-option"
                onClick={() => handleCategorizeCurrent('Food')}
              >
                🍔 Food
              </button>
              <button 
                className="category-option"
                onClick={() => handleCategorizeCurrent('Transport')}
              >
                🚗 Transport
              </button>
              <button 
                className="category-option"
                onClick={() => handleCategorizeCurrent('Rent')}
              >
                🏠 Rent
              </button>
              <button 
                className="category-option"
                onClick={() => handleCategorizeCurrent('Utilities')}
              >
                💡 Utilities
              </button>
              <button 
                className="category-option"
                onClick={() => handleCategorizeCurrent('Entertainment')}
              >
                🎮 Entertainment
              </button>
              <button 
                className="category-option"
                onClick={() => handleCategorizeCurrent('Shopping')}
              >
                🛍️ Shopping
              </button>
              <button 
                className="category-option"
                onClick={() => handleCategorizeCurrent('Health')}
              >
                🏥 Health
              </button>
              <button 
                className="category-option"
                onClick={() => handleCategorizeCurrent('Education')}
              >
                📚 Education
              </button>
              <button 
                className="category-option"
                onClick={() => handleCategorizeCurrent('Travel')}
              >
                ✈️ Travel
              </button>
              <button 
                className="category-option"
                onClick={() => handleCategorizeCurrent('Savings')}
              >
                🏦 Savings
              </button>
              <button 
                className="category-option"
                onClick={() => handleCategorizeCurrent('Insurance')}
              >
                🛡️ Insurance
              </button>
              <button 
                className="category-option"
                onClick={() => handleCategorizeCurrent('Other')}
              >
                📦 Other
              </button>
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button className="skip-btn" onClick={handleSkip}>
                ⏭️ Skip
              </button>
              <button className="close-modal-btn" onClick={handleClose}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PODIUM / STEPPING STONE ===== */}
      {top3.length > 0 && (
        <div className="podium-container">
          <h2 className="podium-title">🏅 Top Spenders</h2>
          
          <div className="podium">
            {/* 2nd Place - Silver */}
            {top3[1] && (
              <div className="podium-step step-2">
                <div className="step-content">
                  <div className="step-medal">🥈</div>
                  <div className="step-rank">#2</div>
                  <div className="step-category">{top3[1].category}</div>
                  <div className="step-amount">
                    {user?.currency || 'KES'} {top3[1].total_amount.toFixed(2)}
                  </div>
                  <div className="step-bar">
                    <div 
                      className="step-bar-fill silver"
                      style={{ width: `${(top3[1].total_amount / totalSpending) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="step-base step-base-2">🥈</div>
              </div>
            )}

            {/* 1st Place - Gold */}
            {top3[0] && (
              <div className="podium-step step-1">
                <div className="step-content">
                  <div className="step-crown">👑</div>
                  <div className="step-medal">🥇</div>
                  <div className="step-rank">#1</div>
                  <div className="step-category">{top3[0].category}</div>
                  <div className="step-amount gold-text">
                    {user?.currency || 'KES'} {top3[0].total_amount.toFixed(2)}
                  </div>
                  <div className="step-bar">
                    <div 
                      className="step-bar-fill gold"
                      style={{ width: `${(top3[0].total_amount / totalSpending) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="step-base step-base-1">🏆</div>
              </div>
            )}

            {/* 3rd Place - Bronze */}
            {top3[2] && (
              <div className="podium-step step-3">
                <div className="step-content">
                  <div className="step-medal">🥉</div>
                  <div className="step-rank">#3</div>
                  <div className="step-category">{top3[2].category}</div>
                  <div className="step-amount">
                    {user?.currency || 'KES'} {top3[2].total_amount.toFixed(2)}
                  </div>
                  <div className="step-bar">
                    <div 
                      className="step-bar-fill bronze"
                      style={{ width: `${(top3[2].total_amount / totalSpending) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="step-base step-base-3">🥉</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== FULL RANKINGS LIST ===== */}
      <div className="rankings-section">
        <div className="rankings-header">
          <h2>📊 Full Rankings</h2>
          <span className="rankings-count">{categories.length} categories</span>
        </div>

        <div className="rankings-list">
          {categories.length === 0 ? (
            <div className="empty-state">
              <p>No categories found</p>
              <p className="empty-hint">Start categorizing your expenses to see rankings!</p>
            </div>
          ) : (
            categories.map((category, index) => (
              <div 
                key={index} 
                className={`ranking-item ${getMedalClass(category.rank)}`}
              >
                <div className="ranking-medal">
                  {getMedal(category.rank)}
                </div>
                <div className="ranking-info">
                  <div className="ranking-category">
                    {getCategoryIcon(category.category)} {category.category}
                  </div>
                  <div className="ranking-rank-label">{getRankLabel(category.rank)}</div>
                </div>
                <div className="ranking-amount">
                  <div className="ranking-total">
                    {user?.currency || 'KES'} {category.total_amount.toFixed(2)}
                  </div>
                  <div className="ranking-percentage">
                    {totalSpending > 0 ? ((category.total_amount / totalSpending) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div className="ranking-bar">
                  <div 
                    className="ranking-bar-fill"
                    style={{ 
                      width: `${(category.total_amount / totalSpending) * 100}%`,
                      background: getRankColor(category.rank)
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
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
    'Savings': '🏦',
    'Insurance': '🛡️',
    'Other': '📦'
  };
  return icons[category] || '📦';
}

// Helper: Get color for rank
function getRankColor(rank) {
  switch(rank) {
    case 1: return '#FFD700';
    case 2: return '#C0C0C0';
    case 3: return '#CD7F32';
    default: return '#4a5a6a';
  }
}