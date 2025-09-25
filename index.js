const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Set up Pug as template engine
app.set('view engine', 'pug');
app.set('views', './views');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// HubSpot API configuration
const PRIVATE_APP_ACCESS_TOKEN = process.env.PRIVATE_APP_ACCESS_TOKEN;
const CUSTOM_OBJECT_TYPE = process.env.CUSTOM_OBJECT_TYPE || 'books';

// Helper function to make HubSpot API calls
const hubspotApiCall = async (method, endpoint, data = null) => {
    const config = {
        method,
        url: `https://api.hubapi.com${endpoint}`,
        headers: {
            'Authorization': `Bearer ${PRIVATE_APP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        config.data = data;
    }
    
    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('HubSpot API Error:', error.response?.status, error.response?.data || error.message);
        throw error;
    }
};

// Route 1: Homepage - Display custom objects from HubSpot
app.get('/', async (req, res) => {
    try {
        console.log('Homepage route accessed');
        console.log('Custom Object Type:', CUSTOM_OBJECT_TYPE);
        
        // Get books from HubSpot
        const response = await hubspotApiCall('GET', `/crm/v3/objects/${CUSTOM_OBJECT_TYPE}?properties=books`);
        
        console.log('Found', response.results ? response.results.length : 0, 'books');
        
        res.render('homepage', {
            title: 'Custom Objects | Integrating With HubSpot I Practicum',
            objects: response.results || []
        });
    } catch (error) {
        console.error('Error fetching books:', error.response?.data || error.message);
        res.render('homepage', {
            title: 'Custom Objects | Integrating With HubSpot I Practicum',
            objects: [],
            error: 'Failed to load books from HubSpot'
        });
    }
});

// Route 2: Display form to create new custom object
app.get('/update-cobj', (req, res) => {
    res.render('updates', {
        title: 'Update Custom Object Form | Integrating With HubSpot I Practicum'
    });
});

// Route 3: Handle form submission to create new custom object
app.post('/update-cobj', async (req, res) => {
    try {
        const { name } = req.body;
        
        console.log('Creating new book with name:', name);
        
        // Create new custom object record
        const newRecord = {
            properties: {
                books: name
            }
        };
        
        const result = await hubspotApiCall('POST', `/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`, newRecord);
        console.log('Book created successfully:', result.id);
        
        // Redirect to homepage after successful creation
        res.redirect('/');
    } catch (error) {
        console.error('Error creating custom object:', error);
        res.render('updates', {
            title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
            error: 'Failed to create custom object: ' + (error.response?.data?.message || error.message)
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});