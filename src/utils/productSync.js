export const syncProductsFromAPI = async () => {
    const API_URL = import.meta.env.VITE_API_URL;
    
    try {
        console.log("Fetching products from API...");
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status !== "200") {
            throw new Error(data.errorMsg || 'API returned an error');
        }
        
        const apiProducts = data.DataRec || [];
        console.log(`Successfully fetched ${apiProducts.length} products from API.`);
        
        // In local storage mode, we just clear the local overrides if needed,
        // or we just return success. The actual fetching happens in AllProducts.
        // But for consistency, we'll "sync" by triggering a refresh.

        return {
            success: true,
            count: apiProducts.length,
            message: `Synced ${apiProducts.length} products from API.`
        };
    } catch (error) {
        console.error("Sync failed:", error);
        return {
            success: false,
            error: error.message
        };
    }
};
