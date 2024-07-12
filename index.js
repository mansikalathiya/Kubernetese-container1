const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 6000;
const storageDir = path.join(__dirname, 'MANSI_PV_dir');

app.use(express.json());

app.get('/',(req,res)=>
{
  res.send("Hello world")
})



app.post('/store-file', async (req, res) => {
  const { file, data } = req.body;

  if (!file || !data) {
    return res.status(400).json({ file: null, error: 'Invalid JSON input.' });
  }

  try {
    const filePath = path.join(storageDir, file);
    await fs.writeFile(filePath, data);
    res.json({ file, message: 'Success.' });
  } catch (err) {
    console.error('File storage error:', err);
    res.status(500).json({ file, error: 'Error while storing the file.' });
  }
});

app.post('/calculate', async (req, res) => {
  const { file, product } = req.body;

  if (!file || !product) {
    return res.status(400).json({ file: null, error: 'Invalid JSON input.' });
  }

  const filePath = path.join(storageDir, file);

  try {
    await fs.access(filePath);
  } catch (err) {
    return res.status(404).json({ file, error: 'File not found.' });
  }

  try {
    const response = await axios.post('http://container2-service:7000/sum', { file, product });
    res.json(response.data);
  } catch (error) {
    console.error('Calculation error:', error.message);
    res.status(500).json({ 
      file: error.response?.data?.file || file, 
      error: error.response?.data?.error || 'Internal server error'
    });
  }
});

async function startServer() {
  try {
    await fs.mkdir(storageDir, { recursive: true });
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

startServer();