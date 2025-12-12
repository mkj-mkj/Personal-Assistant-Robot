// --- Expense ---
// --- Expense ---
window.ExpenseManager = {
    unsubscribe: null,

    init() {
        $('expense-form').onsubmit = (e) => {
            e.preventDefault();
            this.addExpense();
        };
    },

    initListener() {
        if (this.unsubscribe) this.unsubscribe();
        const user = state.user;
        if (!user) return;

        // Mock Mode or No Firebase
        if (user.isMock || !window.firebaseServices) {
            $('expense-mock-badge').classList.remove('hidden');
            // Setup initial dummy data if empty
            if (state.expenses.length === 0) {
                this.render([
                    { id: '1', amount: 200, category: '餐飲', description: '午餐', dateString: '2023/12/12' },
                    { id: '2', amount: 50, category: '交通', description: '捷運', dateString: '2023/12/12' }
                ]);
            }
            return;
        }

        // Firebase Mode
        $('expense-mock-badge').classList.add('hidden');

        try {
            const { db, collection, query, orderBy, onSnapshot } = window.firebaseServices;
            const appId = window.__app_id || 'default-app-id';

            const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'expenses'), orderBy('createdAt', 'desc'));
            this.unsubscribe = onSnapshot(q, (snapshot) => {
                this.render(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        } catch (e) {
            console.error("Firebase expense listener failed:", e);
            // Fallback to mock
            $('expense-mock-badge').classList.remove('hidden');
        }
    },

    async addExpense() {
        const amt = $('expense-amount').value;
        const cat = $('expense-category').value;
        const desc = $('expense-desc').value;
        if (!amt) return;

        const newDoc = {
            amount: Number(amt),
            category: cat,
            description: desc || cat,
            createdAt: new Date(), // Local object for mock
            dateString: new Date().toLocaleDateString()
        };

        if (state.user.isMock || !window.firebaseServices) {
            alert("試用模式：資料已新增至介面 (不會儲存到雲端)");
            this.render([{ ...newDoc, id: Date.now().toString() }, ...state.expenses]);
        } else {
            try {
                const { db, collection, addDoc, serverTimestamp } = window.firebaseServices;
                const appId = window.__app_id || 'default-app-id';
                await addDoc(collection(db, 'artifacts', appId, 'users', state.user.uid, 'expenses'), {
                    ...newDoc,
                    createdAt: serverTimestamp()
                });
            } catch (e) {
                console.error("Add expense failed", e);
                alert("儲存失敗，請檢查網路");
            }
        }
        $('expense-amount').value = '';
        $('expense-desc').value = '';
    },

    async deleteExpense(id) {
        if (state.user.isMock || !window.firebaseServices) {
            this.render(state.expenses.filter(e => e.id !== id));
            return;
        }
        try {
            const { db, doc, deleteDoc } = window.firebaseServices;
            const appId = window.__app_id || 'default-app-id';
            await deleteDoc(doc(db, 'artifacts', appId, 'users', state.user.uid, 'expenses', id));
        } catch (e) {
            console.error("Delete failed", e);
        }
    },

    render(data) {
        state.expenses = data;
        const total = data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        $('expense-total').textContent = `$${total.toLocaleString()}`;

        const tbody = $('expense-table-body');
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
                    <button onclick="window.app.expense.deleteExpense('${item.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer;">
                        <i data-lucide="trash-2" width="16"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        if (window.lucide) lucide.createIcons();
    }
};
