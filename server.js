// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// MongoDB Atlas bağlantısı
mongoose
  .connect(
    'mongodb+srv://nihatsaydam13131:nihat1234@keepsty.hrq40.mongodb.net/Keepsty?retryWrites=true&w=majority&appName=Keepsty'
  )
  .then(() => console.log('Connected to MongoDB Atlas!'))
  .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/* ======================
   Chat Model & Endpoints
   ====================== */

  // Örnek şema (Tech.js veya server.js içinde)
const techSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  username: { type: String, required: true, default: 'Unknown' },
  message: { type: String, required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  language: { type: String, default: 'unknown' },
  timestamp: { type: Date, default: Date.now },

  // Yeni eklediğimizi varsayıyoruz:
  isAccepted: { type: Boolean, default: false },
});

const Tech = mongoose.model('Tech', techSchema, 'Tech');

// Tüm oda numaralarına göre gruplandırılmış sohbet kayıtlarını döndüren endpoint
app.get('/getChatLogse', async (req, res) => {
  try {
    const groupedTech = await Tech.aggregate([
      {
        $group: {
          _id: "$roomNumber",
          messages: { $push: "$$ROOT" },
        },
      },
    ]);
    res.status(200).json(groupedTech);
  } catch (err) {
    console.error('Sohbet kayıtları alınırken hata:', err.message);
    res.status(500).json({ success: false, message: 'Sohbet kayıtları alınırken hata oluştu.' });
  }
});

// Belirli bir oda numarasına ait sohbet kayıtlarını döndüren endpoint
app.get('/getChatLogsByRoome/:roomNumber', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber;
    if (!roomNumber) {
      return res.status(400).json({ success: false, message: 'Oda numarası gerekli.' });
    }
    const techLogs = await Tech.find({ roomNumber }).sort({ timestamp: 1 });
    if (techLogs.length === 0) {
      return res.status(404).json({ success: false, message: 'Bu odaya ait sohbet kaydı bulunamadı.' });
    }
    res.status(200).json(techLogs);
  } catch (err) {
    console.error(`Oda ${req.params.roomNumber} için sohbet alınırken hata:`, err.message);
    res.status(500).json({ success: false, message: 'Oda sohbeti alınırken hata oluştu.' });
  }
});

// Yeni bir sohbet mesajı kaydeden endpoint
app.post('/saveResponsee', async (req, res) => {
  try {
    const { roomNumber, username, message, sender, language } = req.body;
    if (!roomNumber || !username || !message || !sender) {
      return res.status(400).json({ success: false, message: 'Gerekli alanlar eksik.' });
    }
    const newTech = new Tech({ roomNumber, username, message, sender, language });
    await newTech.save();
    res.status(200).json({ success: true, message: 'Mesaj kaydedildi!' });
  } catch (err) {
    console.error('Mesaj kaydedilirken hata oluştu:', err.message);
    res.status(500).json({ success: false, message: 'Mesaj kaydedilirken hata oluştu.' });
  }
});

// İsteği kabul eden endpoint (isAccepted alanını true yapar)
app.put('/acceptRequest/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // İlgili talebi bulup isAccepted alanını true yapıyoruz
    const updatedRequest = await Tech.findByIdAndUpdate(
      id,
      { isAccepted: true },
      { new: true }
    );
    if (!updatedRequest) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    res.status(200).json({ success: true, message: 'Request accepted!', data: updatedRequest });
  } catch (err) {
    console.error("Error updating request:", err.message);
    res.status(500).json({ success: false, message: 'Error accepting request.' });
  }
});
  


// Chat şeması: "Concierge" koleksiyonunda saklanacak
const chatSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  username: { type: String, required: true, default: 'Unknown' },
  message: { type: String, required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  timestamp: { type: Date, default: Date.now },
});
const Chat = mongoose.model('Chat', chatSchema, 'Concierge');

// Tüm oda numaralarına göre gruplandırılmış sohbet kayıtlarını döndüren endpoint
app.get('/getChatLogs', async (req, res) => {
  try {
    const groupedChats = await Chat.aggregate([
      {
        $group: {
          _id: "$roomNumber",
          messages: { $push: "$$ROOT" },
        },
      },
    ]);
    res.status(200).json(groupedChats);
  } catch (err) {
    console.error('Error fetching chat logs:', err.message);
    res
      .status(500)
      .json({ success: false, message: 'Error fetching chat logs.' });
  }
});

// Belirli bir oda numarasına ait sohbet kayıtlarını döndüren endpoint
app.get('/getChatLogsByRoom/:roomNumber', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber;
    if (!roomNumber) {
      return res
        .status(400)
        .json({ success: false, message: 'Room number is required.' });
    }
    const chats = await Chat.find({ roomNumber }).sort({ timestamp: 1 });
    if (chats.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No chats found for this room.' });
    }
    res.status(200).json(chats);
  } catch (err) {
    console.error(`Error fetching chats for room ${req.params.roomNumber}:`, err.message);
    res
      .status(500)
      .json({ success: false, message: 'Error fetching chats for the room.' });
  }
});

// Yeni bir sohbet mesajı kaydeden endpoint
app.post('/saveResponse', async (req, res) => {
  try {
    const { roomNumber, username, message, sender } = req.body;
    if (!roomNumber || !username || !message || !sender) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields.' });
    }
    const chat = new Chat({ roomNumber, username, message, sender });
    await chat.save();
    res.status(200).json({ success: true, message: 'Message saved!' });
  } catch (err) {
    console.error('Error saving message:', err.message);
    res.status(500).json({ success: false, message: 'Error saving message.' });
  }
});
// Bellboy Schema & Model
const bellboySchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  username: { type: String, required: true, default: 'Unknown' },
  clickType: { type: String, required: true },
  details: { type: String },
  selectedTime: { type: Date },
  isProcessed: { type: Boolean, default: false }, // Bu satırı ekleyin.
  timestamp: { type: Date, default: Date.now },
});

const Bellboy = mongoose.model('Bellboy', bellboySchema, 'Bellboy');

// Bellboy Endpoints
app.post('/saveBellboyRequest', async (req, res) => {
  try {
    let { roomNumber, username, clickType, details, selectedTime } = req.body;
    if (!roomNumber || !username || !clickType || !selectedTime) {
      return res.status(400).json({ success: false, message: 'Gerekli alanlar eksik.' });
    }
    if (selectedTime) {
      selectedTime = new Date(selectedTime);
    }
    const bellboyRequest = new Bellboy({ roomNumber, username, clickType, details, selectedTime });
    await bellboyRequest.save();
    res.status(200).json({ success: true, message: 'Bellboy isteği kaydedildi!' });
  } catch (err) {
    console.error('Bellboy isteği kaydedilirken hata oluştu:', err.message);
    res.status(500).json({ success: false, message: 'Bellboy isteği kaydedilirken hata oluştu.' });
  }
});

app.get('/getBellboyRequests', async (req, res) => {
  try {
    const requests = await Bellboy.find().sort({ timestamp: -1 });
    res.status(200).json(requests);
  } catch (err) {
    console.error("Bellboy istekleri alınırken hata:", err.message);
    res.status(500).json({ success: false, message: 'İstekler alınırken hata oluştu.' });
  }
});

// PUT route: Belirtilen id'ye sahip isteği güncelle
app.put('/updateBellboyRequest/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRequest = await Bellboy.findByIdAndUpdate(
      id,
      { isProcessed: true },
      { new: true }
    );
    if (!updatedRequest) {
      return res.status(404).json({ success: false, message: 'İstek bulunamadı.' });
    }
    res.status(200).json({ success: true, message: 'Bellboy isteği güncellendi!', data: updatedRequest });
  } catch (err) {
    console.error("Bellboy isteği güncellenirken hata:", err.message);
    res.status(500).json({ success: false, message: 'İsteği güncellerken hata oluştu.' });
  }
});
// *****************
// Laundry Model & Endpoints
// *****************

const laundrySchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  username: { type: String, required: true, default: 'Unknown' },
  items: [{
    name: { type: String, required: true },
    price: { type: String, required: true },
    quantity: { type: Number, required: true },
  }],
  totalPrice: { type: Number, required: true },
  serviceTime: { type: Number, required: true },         // Örneğin, 30, 60, 120, 240
  serviceTimeLabel: { type: String, required: true },      // Örneğin, "In 30 minutes"
  createdAt: { type: Date, default: Date.now }
});

// Üçüncü parametre olarak 'Laundry' vererek, MongoDB'de koleksiyon ismini belirliyoruz.
const Laundry = mongoose.model('Laundry', laundrySchema, 'Laundry');

// Laundry verilerini kaydeden endpoint
// Laundry verilerini kaydeden endpoint
app.post('/saveLaundry', async (req, res) => {
  try {
    const { roomNumber, items, totalPrice, serviceTime, serviceTimeLabel } = req.body;
    if (!roomNumber || !items || typeof totalPrice === 'undefined' || typeof serviceTime === 'undefined' || !serviceTimeLabel) {
      return res.status(400).json({ 
        success: false, 
        message: 'Gerekli alanlar eksik: roomNumber, items, totalPrice, serviceTime veya serviceTimeLabel.' 
      });
    }
    const newLaundry = new Laundry({ roomNumber, items, totalPrice, serviceTime, serviceTimeLabel });
    await newLaundry.save();
    res.status(200).json({ 
      success: true, 
      message: 'Laundry verileri başarıyla kaydedildi!', 
      laundry: newLaundry 
    });
  } catch (err) {
    console.error('Laundry verileri kaydedilirken hata oluştu:', err.message);
    res.status(500).json({ success: false, message: 'Laundry verileri kaydedilirken hata oluştu.' });
  }
});

// Belirli bir oda numarasına göre Laundry verilerini döndüren endpoint
app.get('/getLaundry/:roomNumber', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    if (!roomNumber) {
      return res.status(400).json({ success: false, message: 'Oda numarası gereklidir.' });
    }
    const laundryData = await Laundry.find({ roomNumber }).sort({ createdAt: -1 });
    if (laundryData.length === 0) {
      return res.status(404).json({ success: false, message: 'Bu odaya ait laundry verisi bulunamadı.' });
    }
    res.status(200).json({ success: true, laundry: laundryData });
  } catch (err) {
    console.error('Laundry verileri alınırken hata oluştu:', err.message);
    res.status(500).json({ success: false, message: 'Laundry verileri alınırken hata oluştu.' });
  }
});

/* ==========================
   Complain Model & Endpoints
   ========================== */


const complainSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  username: { type: String, required: true, default: 'Unknown' },
  language: { type: String, required: true, default: 'unknown' },
  message: { type: String, required: true },
  sender: { type: String, required: true }, // 'user' veya 'bot'
  createdAt: { type: Date, default: Date.now }
});

// Üçüncü parametre ile koleksiyon ismi 'Complain' olarak belirleniyor.
const Complain = mongoose.model('Complain', complainSchema, 'Complain');

// Mesaj kaydetme endpoint'i
app.post('/savecomplain', async (req, res) => {
  try {
    const { roomNumber, username, language, message, sender } = req.body;
    if (!roomNumber || !message || !sender) {
      return res.status(400).json({ 
        success: false, 
        message: 'Gerekli alanlar eksik: roomNumber, message veya sender.' 
      });
    }
    
    const newComplain = new Complain({ roomNumber, username, language, message, sender });
    await newComplain.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Message saved successfully!',
      complain: newComplain 
    });
  } catch (err) {
    console.error('Error saving complain:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving complain.' 
    });
  }
});

// Belirli oda numarasına göre mesajları getiren endpoint
app.get('/getChatLogsByRoomcomplain/:roomNumber', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    if (!roomNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room number is required.' 
      });
    }
    
    const messages = await Complain.find({ roomNumber }).sort({ createdAt: 1 });
    if (messages.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No messages found for this room.' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      messages 
    });
  } catch (err) {
    console.error('Error fetching complain messages:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching messages.' 
    });
  }
});
app.get('/getComplain', async (req, res) => {
  try {
    const groupedComplain = await Complain.aggregate([ // Chat yerine Complain
      {
        $group: {
          _id: "$roomNumber",
          messages: { $push: "$$ROOT" },
        },
      },
    ]);
    res.status(200).json(groupedComplain);
  } catch (err) {
    console.error('Error fetching complain logs:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching complains.' });
  }
});
// RoomService Schema & Model
const roomServiceSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  username: { type: String, required: true, default: "Unknown" },
  items: [{
    name: { type: String, required: true },
    price: { type: String, required: true },
    quantity: { type: Number, required: true }
  }],
  totalPrice: { type: Number, required: true },
  serviceTime: { type: Number, required: true },        // Örneğin, 10, 60, 120, 180
  serviceTimeLabel: { type: String, required: true },     // Örneğin, "10 min", "1 hour"
  createdAt: { type: Date, default: Date.now }
});

// Üçüncü parametre ile koleksiyon ismi "RoomService" olarak belirleniyor.
const RoomService = mongoose.model('RoomService', roomServiceSchema, 'RoomService');

// RoomService verilerini kaydeden endpoint
app.post('/saveRoomservice', async (req, res) => {
  try {
    const { roomNumber, username, items, totalPrice, serviceTime, serviceTimeLabel } = req.body;
    
    // Gerekli alanların kontrolü
    if (!roomNumber || !items || typeof totalPrice === 'undefined' || typeof serviceTime === 'undefined' || !serviceTimeLabel) {
      return res.status(400).json({
        success: false,
        message: "Gerekli alanlar eksik: roomNumber, items, totalPrice, serviceTime veya serviceTimeLabel."
      });
    }
    
    const newRoomService = new RoomService({ roomNumber, username, items, totalPrice, serviceTime, serviceTimeLabel });
    await newRoomService.save();
    
    res.status(200).json({
      success: true,
      message: "Room service başarıyla kaydedildi!",
      roomService: newRoomService
    });
  } catch (error) {
    console.error("Room service kaydedilirken hata oluştu:", error.message);
    res.status(500).json({
      success: false,
      message: "Room service kaydedilirken hata oluştu."
    });
  }
});

// Opsiyonel: Tüm RoomService kayıtlarını getiren endpoint
app.get('/getRoomservices', async (req, res) => {
  try {
    const roomServices = await RoomService.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, roomServices });
  } catch (error) {
    console.error("Room service kayıtları alınırken hata:", error.message);
    res.status(500).json({
      success: false,
      message: "Room service kayıtları alınırken hata oluştu."
    });
  }
});
// Ana sayfa endpoint'i (Opsiyonel)
app.get('/', (req, res) => {
  res.send('Welcome to Keepsty Backend API!');
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
