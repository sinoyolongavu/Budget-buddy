document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const expenseForm = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const noExpenses = document.getElementById('no-expenses');
    const filterCategory = document.getElementById('filter-category');
    const filterMonth = document.getElementById('filter-month');
    const totalExpensesEl = document.getElementById('total-expenses');
    const monthlyExpensesEl = document.getElementById('monthly-expenses');
    const categoryCountEl = document.getElementById('category-count');
    const editIdInput = document.getElementById('edit-id');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const submitText = document.getElementById('submit-text');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const paginationControls = document.getElementById('pagination-controls');
    
    // Modal elements
    const exportModal = document.getElementById('export-modal');
    const importModal = document.getElementById('import-modal');
    const resetModal = document.getElementById('reset-modal');
    const loadingModal = document.getElementById('loading-modal');
    const exportDataText = document.getElementById('export-data-text');
    const importDataText = document.getElementById('import-data-text');
    
    // Chart instances
    let categoryChart = null;
    let monthlyTrendChart = null;
    
    // Pagination
    let currentPage = 1;
    const itemsPerPage = 10;
    
    // Load expenses from localStorage
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    
    // Initialize the app
    initDateInput();
    renderExpenses();
    updateSummary();
    updateMonthFilter();
    updateCharts();
    
    // Set today's date as default
    function initDateInput() {
        const today = new Date();
        const dateInput = document.getElementById('date');
        dateInput.valueAsDate = today;
    }
    
    // Add expense
    expenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        const editId = editIdInput.value;
        
        if (editId) {
            // Update existing expense
            const index = expenses.findIndex(exp => exp.id === parseInt(editId));
            if (index !== -1) {
                expenses[index] = {
                    id: parseInt(editId),
                    description,
                    amount,
                    category,
                    date
                };
            }
        } else {
            // Add new expense
            const expense = {
                id: Date.now(),
                description,
                amount,
                category,
                date
            };
            
            expenses.push(expense);
        }
        
        saveExpenses();
        renderExpenses();
        updateSummary();
        updateMonthFilter();
        updateCharts();
        
        // Reset form
        expenseForm.reset();
        editIdInput.value = '';
        cancelEditBtn.classList.add('hidden');
        submitText.textContent = 'Add Expense';
        document.getElementById('date').valueAsDate = new Date();
        
        // Show success animation
        const submitBtn = expenseForm.querySelector('button[type="submit"]');
        submitBtn.classList.add('pulse');
        setTimeout(() => submitBtn.classList.remove('pulse'), 2000);
    });
    
    // Cancel edit
    cancelEditBtn.addEventListener('click', function() {
        expenseForm.reset();
        editIdInput.value = '';
        this.classList.add('hidden');
        submitText.textContent = 'Add Expense';
        document.getElementById('date').valueAsDate = new Date();
    });
    
    // Filter expenses
    filterCategory.addEventListener('change', function() {
        currentPage = 1;
        renderExpenses();
    });
    
    filterMonth.addEventListener('change', function() {
        currentPage = 1;
        renderExpenses();
    });
    
    // Pagination controls
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderExpenses();
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(getFilteredExpenses().length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderExpenses();
        }
    });
    
    // Export data
    document.getElementById('export-data').addEventListener('click', function() {
        exportDataText.value = JSON.stringify(expenses, null, 2);
        exportModal.style.display = 'flex';
    });
    
    document.getElementById('copy-export').addEventListener('click', function() {
        exportDataText.select();
        document.execCommand('copy');
        this.textContent = 'Copied!';
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-copy mr-1"></i> Copy';
        }, 2000);
    });
    
    document.getElementById('close-export').addEventListener('click', function() {
        exportModal.style.display = 'none';
    });
    
    // Import data
    document.getElementById('import-data').addEventListener('click', function() {
        importModal.style.display = 'flex';
    });
    
    document.getElementById('cancel-import').addEventListener('click', function() {
        importModal.style.display = 'none';
        importDataText.value = '';
    });
    
    document.getElementById('confirm-import').addEventListener('click', function() {
        try {
            const importedData = JSON.parse(importDataText.value);
            if (Array.isArray(importedData) && importedData.length > 0) {
                // Basic validation
                const isValid = importedData.every(item => {
                    return item.hasOwnProperty('description') && 
                           item.hasOwnProperty('amount') && 
                           item.hasOwnProperty('category') && 
                           item.hasOwnProperty('date');
                });
                
                if (isValid) {
                    showLoading();
                    setTimeout(() => {
                        expenses = importedData;
                        saveExpenses();
                        renderExpenses();
                        updateSummary();
                        updateMonthFilter();
                        updateCharts();
                        hideLoading();
                        importModal.style.display = 'none';
                        importDataText.value = '';
                        
                        // Show success message
                        alert('Data imported successfully!');
                    }, 1000);
                } else {
                    alert('Invalid data format. Please check your import data.');
                }
            } else {
                alert('No valid data found to import.');
            }
        } catch (e) {
            alert('Error parsing data. Please check your import data.');
            console.error(e);
        }
    });
    
    // Reset data
    document.getElementById('reset-data').addEventListener('click', function() {
        resetModal.style.display = 'flex';
    });
    
    document.getElementById('cancel-reset').addEventListener('click', function() {
        resetModal.style.display = 'none';
    });
    
    document.getElementById('confirm-reset').addEventListener('click', function() {
        showLoading();
        setTimeout(() => {
            expenses = [];
            saveExpenses();
            renderExpenses();
            updateSummary();
            updateMonthFilter();
            updateCharts();
            hideLoading();
            resetModal.style.display = 'none';
        }, 1000);
    });
    
    // Modal close on outside click
    window.addEventListener('click', function(e) {
        if (e.target === exportModal) {
            exportModal.style.display = 'none';
        }
        if (e.target === importModal) {
            importModal.style.display = 'none';
            importDataText.value = '';
        }
        if (e.target === resetModal) {
            resetModal.style.display = 'none';
        }
    });
    
    // Save expenses to localStorage
    function saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }
    
    // Get filtered expenses based on current filters
    function getFilteredExpenses() {
        const categoryFilter = filterCategory.value;
        const monthFilter = filterMonth.value;
        
        let filtered = [...expenses];
        
        // Apply category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(exp => exp.category === categoryFilter);
        }
        
        // Apply month filter
        if (monthFilter !== 'all') {
            const [year, month] = monthFilter.split('-');
            filtered = filtered.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getFullYear() === parseInt(year) && 
                       (expDate.getMonth() + 1) === parseInt(month);
            });
        }
        
        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return filtered;
    }
    
    // Render expenses with pagination
    function renderExpenses() {
        const filteredExpenses = getFilteredExpenses();
        const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
        
        if (filteredExpenses.length === 0) {
            noExpenses.style.display = 'block';
            expenseList.innerHTML = '';
            expenseList.appendChild(noExpenses);
            paginationControls.style.display = 'none';
            return;
        }
        
        noExpenses.style.display = 'none';
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);
        
        expenseList.innerHTML = paginatedExpenses.map(expense => {
            const date = new Date(expense.date);
            const formattedDate = date.toLocaleDateString('en-ZA', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            
            return `
                <div class="expense-item bg-white p-4 rounded-lg shadow-sm flex justify-between items-center category-${expense.category.toLowerCase()}">
                    <div>
                        <h3 class="font-semibold text-[#014421]">${expense.description}</h3>
                        <div class="flex items-center mt-1 text-sm text-gray-600">
                            <span class="inline-block px-2 py-1 text-xs font-semibold rounded mr-3" 
                                  style="background-color: ${getCategoryColor(expense.category)}; color: #014421;">
                                ${expense.category}
                            </span>
                            <span>${formattedDate}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-lg mr-2">R${expense.amount.toFixed(2)}</span>
                        <button class="edit-btn" data-id="${expense.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" data-id="${expense.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update pagination controls
        if (filteredExpenses.length > itemsPerPage) {
            paginationControls.style.display = 'flex';
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage === totalPages;
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        } else {
            paginationControls.style.display = 'none';
        }
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteExpense(id);
            });
        });
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                editExpense(id);
            });
        });
    }
    
    // Delete expense
    function deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            expenses = expenses.filter(exp => exp.id !== id);
            saveExpenses();
            renderExpenses();
            updateSummary();
            updateMonthFilter();
            updateCharts();
            
            // Show delete animation
            const deletedItem = document.querySelector(`.delete-btn[data-id="${id}"]`).closest('.expense-item');
            if (deletedItem) {
                deletedItem.style.transform = 'translateX(100%)';
                deletedItem.style.opacity = '0';
                setTimeout(() => {
                    renderExpenses();
                }, 300);
            }
        }
    }
    
    // Edit expense
    function editExpense(id) {
        const expense = expenses.find(exp => exp.id === id);
        if (expense) {
            document.getElementById('description').value = expense.description;
            document.getElementById('amount').value = expense.amount;
            document.getElementById('category').value = expense.category;
            document.getElementById('date').value = expense.date;
            editIdInput.value = expense.id;
            cancelEditBtn.classList.remove('hidden');
            submitText.textContent = 'Update Expense';
            
            // Scroll to form
            document.getElementById('expense-form').scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Update summary
    function updateSummary() {
        // Total expenses
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        totalExpensesEl.textContent = `R${total.toFixed(2)}`;
        
        // Monthly expenses (current month)
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyTotal = expenses.reduce((sum, exp) => {
            const expDate = new Date(exp.date);
            if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
                return sum + exp.amount;
            }
            return sum;
        }, 0);
        
        monthlyExpensesEl.textContent = `R${monthlyTotal.toFixed(2)}`;
        
        // Category count
        const uniqueCategories = new Set(expenses.map(exp => exp.category));
        categoryCountEl.textContent = uniqueCategories.size;
    }
    
    // Update month filter options
    function updateMonthFilter() {
        // Get all unique months from expenses
        const monthSet = new Set();
        expenses.forEach(exp => {
            const date = new Date(exp.date);
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // Months are 0-indexed
            monthSet.add(`${year}-${month.toString().padStart(2, '0')}`);
        });
        
        // Convert to array and sort descending
        const months = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
        
        // Update select options
        filterMonth.innerHTML = '<option value="all">All Months</option>';
        months.forEach(month => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(`${year}-${monthNum}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            filterMonth.innerHTML += `<option value="${month}">${monthName}</option>`;
        });
    }
    
    // Update charts
    function updateCharts() {
        updateCategoryChart();
        updateMonthlyTrendChart();
    }
    
    // Update category chart
    function updateCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        // Group by category
        const categories = {};
        expenses.forEach(exp => {
            if (!categories[exp.category]) {
                categories[exp.category] = 0;
            }
            categories[exp.category] += exp.amount;
        });
        
        const labels = Object.keys(categories);
        const data = Object.values(categories);
        const backgroundColors = labels.map(cat => getCategoryColor(cat));
        
        if (categoryChart) {
            categoryChart.data.labels = labels;
            categoryChart.data.datasets[0].data = data;
            categoryChart.data.datasets[0].backgroundColor = backgroundColors;
            categoryChart.update();
        } else {
            categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: R${value.toFixed(2)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Update monthly trend chart
    function updateMonthlyTrendChart() {
        const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
        
        // Group by month
        const months = {};
        expenses.forEach(exp => {
            const date = new Date(exp.date);
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // Months are 0-indexed
            const key = `${year}-${month.toString().padStart(2, '0')}`;
            
            if (!months[key]) {
                months[key] = 0;
            }
            months[key] += exp.amount;
        });
        
        // Sort months chronologically
        const sortedMonths = Object.keys(months).sort();
        const labels = sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            return new Date(`${year}-${monthNum}-01`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        });
        const data = sortedMonths.map(month => months[month]);
        
        if (monthlyTrendChart) {
            monthlyTrendChart.data.labels = labels;
            monthlyTrendChart.data.datasets[0].data = data;
            monthlyTrendChart.update();
        } else {
            monthlyTrendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Monthly Spending',
                        data: data,
                        backgroundColor: 'rgba(1, 68, 33, 0.1)',
                        borderColor: '#014421',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `R${context.raw.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R' + value;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Get category color
    function getCategoryColor(category) {
        const colors = {
            'Food': '#FFD700',
            'Travel': '#014421',
            'Utilities': '#FFD700',
            'Entertainment': '#014421',
            'Other': '#888'
        };
        return colors[category] || '#888';
    }
    
    // Show loading modal
    function showLoading() {
        loadingModal.style.display = 'flex';
    }
    
    // Hide loading modal
    function hideLoading() {
        loadingModal.style.display = 'none';
    }
    
    // Random greetings
    const greetings = [
        "Sawubona! Let's track your spending.",
        "Molo! Ready to budget like a pro?",
        "Howzit! Time to manage those Rands.",
        "Sharp! Let's get your finances sorted.",
        "Aweh! Track every cent today."
    ];
    
    // Set random greeting on load
    const greetingEl = document.querySelector('.greeting');
    greetingEl.textContent = greetings[Math.floor(Math.random() * greetings.length)];
});