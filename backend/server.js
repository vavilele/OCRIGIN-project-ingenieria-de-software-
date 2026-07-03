require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use((req, res, next) => {
  console.log(`[DEBUG] Recibido: ${req.method} ${req.url}`);
  next();
});


const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let model = null;
try {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
} catch (e) {
  console.error('No se pudo inicializar Gemini:', e.message);
}


const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('¡Conectado con éxito a MongoDB Atlas!'))
  .catch(err => console.error('Error crítico al conectar a MongoDB:', err));


const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);


const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId; // Almacenamos el ID en la petición para las rutas filtros
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

const CharacterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  age: { type: String },
  birthDate: { type: String },
  origin: { type: String },
  role: { type: String },
  occupation: { type: String },
  maritalStatus: { type: String },
  description: { type: String }
});
const Character = mongoose.model('Character', CharacterSchema);





app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    let userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'El correo ya está registrado.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.json({ success: true, message: '¡Usuario registrado con éxito!' });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor al registrar.' });
  }
});


app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Intentando buscar usuario con email:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("-> Fallo: Usuario no encontrado en la base de datos.");
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("-> Fallo: La contraseña no coincide.");
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    console.log("-> Éxito: Contraseña correcta, generando token...");
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, username: user.username });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor al iniciar sesión.' });
  }
});


app.post('/api/improve-description', async (req, res) => {
  const { description, fullName } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'La descripción está vacía.' });
  }

  try {
    const prompt = `
      Actúa como un escritor creativo experto en literatura, cómics y desarrollo de videojuegos. 
      Tu tarea es mejorar, embellecer y expandir sutilmente la siguiente descripción de un personaje llamado "${fullName || 'Anónimo'}". 
      Dale un tono narrativo profesional, fluido, estético y atractivo para una ficha técnica de rol o diseño.
      REGLA CRÍTICA: Devuelve ÚNICAMENTE el texto mejorado final.
      Texto original del usuario: ${description}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ success: true, improvedDescription: response.text().trim() });
  } catch (error) {
    res.status(500).json({ error: 'Google rechazó la petición de IA.', details: error.message });
  }
});


app.get('/api/characters', verificarToken, async (req, res) => {
  try {
    const characters = await Character.find({ userId: req.userId });
    res.json(characters);
  } catch (error) {
    res.status(500).json([]);
  }
});


app.post('/api/characters', verificarToken, async (req, res) => {
  try {
    const newChar = new Character({
      ...req.body,
      userId: req.userId
    });
    await newChar.save();
    res.json({ success: true, message: '¡Ficha de personaje creada con éxito!', character: newChar });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar el personaje' });
  }
});


app.delete('/api/characters/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Character.findOneAndDelete({ _id: id, userId: req.userId });

    if (!deleted) {
      return res.status(404).json({ error: 'Personaje no encontrado o no tienes permiso.' });
    }
    res.json({ success: true, message: 'Personaje eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el personaje' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor de OCrigin corriendo en http://localhost:${PORT}`);
});