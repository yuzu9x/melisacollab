const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Storing drawing history for each cookie
const drawingHistory = [];

io.on('connection', (socket) => {
  console.log('User connected');
  
  // Send existing drawings to new user
  socket.emit('load-drawings', drawingHistory);

  socket.on('draw', (data) => {
    drawingHistory.push(data);
    socket.broadcast.emit('draw', data);
  });

  socket.on('clear-cookie', (cookieId) => {
    // Remove drawings for specific cookie
    const filteredHistory = drawingHistory.filter(d => d.cookieId !== cookieId);
    drawingHistory.length = 0;
    drawingHistory.push(...filteredHistory);
    
    socket.broadcast.emit('clear-cookie', cookieId);
  });

  socket.on('clear-all', () => {
    drawingHistory.length = 0;
    socket.broadcast.emit('clear-all');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
