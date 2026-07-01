const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
    // Test database connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
        console.error('❌ Cannot start server without database connection');
        process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

startServer();