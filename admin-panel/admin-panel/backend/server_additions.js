// ADD THESE TWO LINES to your existing server.js
// Place them alongside your other app.use('/api/...') route lines:

app.use('/api/staff',      require('./routes/staff'));
app.use('/api/superadmin', require('./routes/superadmin'));

// That's all you need to add to server.js!
