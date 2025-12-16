// --- Expense ---
window.ExpenseManager = {
    init() {
        $('expense-form').onsubmit = (e) => {
            e.preventDefault();
            this.addExpense();
        };
    },

    async initListener() {
        // Load initial data from API
        await this.loadExpenses();
    },

    async loadExpenses() {
        try {
            const user = window.state?.user;
            if (!user || !user.uid) {
                console.warn("ExpenseManager: No user logged in, clearing data");
                this.render([]);
                return;
            }

            const res = await fetch(`${CONFIG.API_BASE_URL}/expense?userId=${user.uid}`);
            if (!res.ok) throw new Error("Failed to fetch expenses: " + res.status);
            let data = await res.json();

            // Handle Lambda Proxy Integration response if it wasn't unwrapped by API Gateway
            if (data.body && typeof data.body === 'string') {
                try {
                    data = JSON.parse(data.body);
                } catch (e) {
                    console.error("Failed to parse inner body", e);
                }
            }

            // Ensure data is an array
            if (!Array.isArray(data)) {
                console.error("ExpenseManager: Expected array but got", data);
                // If it's an empty object or null, treat as empty array
                if (!data || Object.keys(data).length === 0) {
                    data = [];
                } else {
                    throw new Error("Invalid expense data received");
                }
            }

            // Sort by createdAt desc if possible, or handle in frontend
            // The backend scan doesn't guarantee order, so let's sort here
            data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Format dateString for display if not present
            const formattedData = data.map(item => ({
                ...item,
                dateString: item.dateString || new Date(item.createdAt).toLocaleDateString()
            }));

            this.render(formattedData);
        } catch (e) {
            console.error("Load expenses failed", e);
            // Show error or empty state
            this.render([]);
        }
    },

    async addExpense() {
        const amt = $('expense-amount').value;
        const cat = $('expense-category').value;
        const desc = $('expense-desc').value;
        if (!amt) return;

        const user = window.state?.user;
        if (!user || !user.uid) {
            alert("請先登入");
            return;
        }

        const payload = {
            userId: user.uid,
            amount: Number(amt),
            category: cat,
            description: desc || cat,
            dateString: new Date().toLocaleDateString()
        };

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/expense`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Add expense failed");

            // Reload list to get updated data
            await this.loadExpenses();

            $('expense-amount').value = '';
            $('expense-desc').value = '';
        } catch (e) {
            console.error("Add expense failed", e);
            alert("新增失敗，請檢查網路或後端狀態");
        }
    },

    async deleteExpense(id) {
        if (!confirm("確定要刪除嗎？")) return;

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/expense?id=${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error("Delete failed");

            // Reload list
            await this.loadExpenses();
        } catch (e) {
            console.error("Delete failed", e);
            alert("刪除失敗");
        }
    },

    render(data) {
        state.expenses = data;
        const total = data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const totalEl = $('expense-total');
        if (totalEl) totalEl.textContent = `$${total.toLocaleString()}`;

        const tbody = $('expense-table-body');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 2rem; text-align: center; color: var(--text-muted);">無資料</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td style="color: var(--text-muted); font-family: monospace;">${item.dateString}</td>
                <td><span style="background: var(--bg-hover); padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">${item.category}</span></td>
                <td>${item.description}</td>
                <td style="text-align: right; color: var(--accent-emerald); font-weight: bold;">$${item.amount}</td>
                <td style="text-align: center;">
                    <button onclick="window.ExpenseManager.deleteExpense('${item.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer;">
                        <i data-lucide="trash-2" width="16"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        if (window.lucide) lucide.createIcons();
    }
};
