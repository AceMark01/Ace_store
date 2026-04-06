/**
 * Utility to seed LocalStorage with dummy data for development and testing.
 */
export const seedDummyData = () => {
    // 1. Seed Users (ace_store_users)
    const existingUsers = JSON.parse(localStorage.getItem('ace_store_users') || '[]');
    if (existingUsers.length === 0) {
        const dummyUsers = [
            { id: 'u1', fullName: 'John Doe', email: 'john@example.com', password: '123', phone: '9876543210', role: 'customer', city: 'Mumbai', state: 'MH' },
            { id: 'u2', fullName: 'Alice Smith', email: 'alice@example.com', password: '123', phone: '9876543211', role: 'customer', city: 'Delhi', state: 'DL' },
            { id: 'u3', fullName: 'Bob Johnson', email: 'bob@example.com', password: '123', phone: '9876543212', role: 'customer', city: 'Bangalore', state: 'KA' },
            { id: 'u4', fullName: 'Charlie Brown', email: 'charlie@example.com', password: '123', phone: '9876543213', role: 'customer', city: 'Chennai', state: 'TN' },
            { id: 'u5', fullName: 'Eve Wilson', email: 'eve@example.com', password: '123', phone: '9876543214', role: 'customer', city: 'Kolkata', state: 'WB' },
        ];
        localStorage.setItem('ace_store_users', JSON.stringify(dummyUsers));
        console.log("Dummy users seeded.");
    }

    // 2. Seed Orders (localOrders)
    const existingOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
    if (existingOrders.length === 0) {
        const statuses = ['PENDING', 'APPROVED', 'DISPATCHED', 'DELIVERED'];
        const products = [
            { name: 'Hammer Drill HB-20', category: 'Hardware', price: 4500 },
            { name: 'Pipe Wrench 12"', category: 'Hardware', price: 850 },
            { name: 'Chrome Faucet High-End', category: 'Sanitary', price: 2100 },
            { name: 'PVC Joint Tube', category: 'Sanitary', price: 120 },
            { name: 'Steel Hinge Pair', category: 'Hardware', price: 340 },
        ];
        
        const dummyOrders = [];
        const userIds = ['u1', 'u2', 'u3', 'u4', 'u5', 'hardcoded-user-id'];
        
        for (let i = 0; i < 25; i++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const qty = Math.floor(Math.random() * 5) + 1;
            const daysAgo = Math.floor(Math.random() * 10);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);

            dummyOrders.push({
                order_id: `ORD-${Date.now()}-${i}`,
                customer_id: userIds[Math.floor(Math.random() * userIds.length)],
                product_name: product.name,
                product_category: product.category,
                quantity: qty,
                amount: product.price * qty,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                created_at: date.toISOString()
            });
        }
        localStorage.setItem('localOrders', JSON.stringify(dummyOrders));
        console.log("Dummy orders seeded.");
    }

    // 3. Seed some Media Overrides
    const existingOverrides = JSON.parse(localStorage.getItem('productMediaOverrides') || '{}');
    if (Object.keys(existingOverrides).length === 0) {
        // Just as an example, we don't know the real product IDs from the API here 
        // until we fetch them, so we'll leave it mostly empty or add common ones if we had them.
    }
};
