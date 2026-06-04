// Load Orders
function loadOrders() {
    updateStats();
    renderOrders();
}

// Update Stats
function updateStats() {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('totalRevenue').textContent = `Rp ${totalRevenue.toLocaleString('id-ID')}`;
}

// Render Orders Table
function renderOrders(searchTerm = '') {
    const filteredOrders = orders.filter(order => 
        order.id.toString().includes(searchTerm) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const ordersTable = document.getElementById('ordersTable');
    
    if (filteredOrders.length === 0) {
        ordersTable.innerHTML = '<p style="text-align: center; padding: 3rem; color: #666;">Tidak ada pesanan ditemukan</p>';
        return;
    }

    ordersTable.innerHTML = filteredOrders.map(order => `
        <div class="order-row" data-order-id="${order.id}">
            <div class="order-id">#${order.id}</div>
            <div class="order-status status-${order.status}">${order.status.toUpperCase()}</div>
            <div class="customer-info">
                <div class="customer-name">${order.customer.name}</div>
                <div class="customer-details">
                    ${order.customer.email} | ${order.customer.phone || 'N/A'}
                </div>
                <div class="customer-details">${order.customer.address}</div>
            </div>
            <div class="order-total">Rp ${order.total.toLocaleString('id-ID')}</div>
            <div class="status-actions">
                ${order.status === 'pending' ? 
                    `<button class="status-btn btn-ship" onclick="updateOrderStatus(${order.id}, 'shipped')">Ship</button>` : ''
                }
                ${order.status === 'pending' || order.status === 'shipped' ? 
                    `<button class="status-btn btn-deliver" onclick="updateOrderStatus(${order.id}, 'delivered')">Deliver</button>` : ''
                }
                ${order.status !== 'cancelled' ?
                    `<button class="status-btn btn-cancel" onclick="updateOrderStatus(${order.id}, 'cancelled')">Cancel</button>` : ''
                }
            </div>
        </div>
    `).join('');
}

// Update Order Status
function updateOrderStatus(orderId, status) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        order.updatedAt = new Date().toISOString();
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrders();
        showNotification(`✅ Status pesanan #${orderId} diupdate ke ${status}`, 'success');
    }
}

// Search Orders
document.getElementById('searchOrders').addEventListener('input', (e) => {
    renderOrders(e.target.value);
});

// Export CSV
document.getElementById('exportOrders').addEventListener('click', () => {
    const csv = generateCSV();
    downloadCSV(csv, 'orders.csv');
    showNotification('📥 Data pesanan berhasil diexport!', 'success');
});

function generateCSV() {
    const headers = ['ID', 'Customer', 'Email', 'Phone', 'Address', 'Items', 'Total', 'Status', 'Order Date', 'Updated'];
    const rows = orders.map(order => [
        order.id,
        order.customer.name,
        order.customer.email,
        order.customer.phone || '',
        order.customer.address,
        order.items.map(i => i.name).join(', '),
        order.total,
        order.status,
        new Date(order.createdAt).toLocaleDateString('id-ID'),
        new Date(order.updatedAt).toLocaleDateString('id-ID')
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ========== UPDATE CHECKOUT FUNCTION ==========
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        showNotification('🛒 Keranjang kosong!', 'error');
        return;
    }

    // Show checkout form
    const customerName = prompt('Nama Lengkap:');
    const customerEmail = prompt('Email:');
    const customerPhone = prompt('No. WhatsApp:');
    const customerAddress = prompt('Alamat Lengkap:');

    if (customerName && customerEmail && customerAddress) {
        const order = {
            id: Date.now(),
            customer: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
                address: customerAddress
            },
            items: [...cart],
            total: updateCartTotal(),
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Clear cart
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
        cartModal.classList.remove('active');
        
        showNotification('✅ Pesanan berhasil dibuat! No. Pesanan: #' + order.id, 'success');
        
        // Notify admin (simulasi)
        console.log('🔔 New Order Alert:', order);
    }
});