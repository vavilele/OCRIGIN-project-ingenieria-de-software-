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
  origin: [
    'https://ocrigin.onrender.com',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI = null;
let model = null;
try {
  if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
  } else {
    console.warn('[AI WARN] No se detectó la variable GEMINI_API_KEY. El servicio de IA correrá en modo simulado.');
  }
} catch (e) {
  console.error('[AI ERROR] No se pudo inicializar la API de Google Gemini:', e.message);
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

const CharacterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No se encontró un token de sesión válido.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'La sesión ha expirado o el token es inválido.' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    let userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.json({ success: true, message: '¡Usuario registrado con éxito!' });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor al procesar el registro.' });
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

    console.log(`\n================================================================================`);
    console.log(`[TRACE 1 - USER PROMPT] Timestamp: ${new Date().toISOString()}`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(` Target Character: "${fullName || 'Anónimo'}"`);
    console.log(` Raw Description Received: "${description}"`);


    console.log(`\n[TRACE 2 - CONTEXT STRUCTURED]`);
    console.log(`--------------------------------------------------------------------------------`);
    const systemInstruction =
      "Actúa como un escritor creativo experto en literatura, cómics y desarrollo de videojuegos. " +
      "Tu tarea es mejorar, embellecer y expandir sutilmente la siguiente descripción de un personaje. " +
      "Dale un tono narrativo profesional, fluido, estético y atractivo para una ficha técnica de rol o diseño. " +
      "REGLA CRÍTICA: Devuelve ÚNICAMENTE el texto mejorado final. No incluyas saludos ni explicaciones.";
    console.log(` System Instructions applied for description enhancement.`);

    const promptConsolidado = `${systemInstruction}\n\nTexto original del usuario: ${description}`;

    console.log(`\n[TRACE 3 - CONSOLIDATED PROMPT SENT TO GOOGLE AI STUDIO]`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(` Final Payload sent to Gemini API:\n"""\n${promptConsolidado}\n"""`);

    if (!model) {
      throw new Error('Servicio de IA no inicializado debido a falta de API Key.');
    }

    const result = await model.generateContent(promptConsolidado);
    const response = await result.response;
    const responseText = response.text().trim();

    console.log(`\n================================================================================`);
    console.log(`[TRACE END - API STATUS: 200 OK]`);
    console.log(` Improved Description Result: "${responseText}"`);
    console.log(`================================================================================\n`);

    res.json({ success: true, improvedDescription: responseText });

  } catch (error) {
    console.error(`\n================================================================================`);
    console.error(`[TRACE END - ERROR DETECTED]`);
    console.error(` Error Stack: ${error.message}`);
    console.error(`================================================================================\n`);

    if (error.status === 429 || error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        success: false,
        error: 'El asistente creativo de IA está saturado en su capa gratuita. Por favor, espera 30 segundos antes de volver a generar.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Google rechazó la petición de IA.',
      details: error.message
    });
  }
});

app.post('/api/orchestrate', verificarToken, async (req, res) => {
  const { queryText, characterName } = req.body;
  const userId = req.userId;

  try {
    console.log(`\n================================================================================`);
    console.log(`[TRACE 1 - USER PROMPT] Timestamp: ${new Date().toISOString()}`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`   Authenticated User ID: "${userId}"`);
    console.log(`   Raw Message Received: "${queryText}"`);
    console.log(`   Identified Entity/Target: "${characterName}"`);

    const charactersContext = await Character.find({
      userId: userId,
      fullName: { $regex: new RegExp(characterName, 'i') }
    });

    console.log(`\n[TRACE 2 - MONGO CONTEXT EXTRACTED]`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`   Query Filter: { "userId": "${userId}", "fullName": /${characterName}/i }`);
    console.log(`   Documents Found: ${charactersContext.length}`);
    console.log(`   Serialized Context:\n${JSON.stringify(charactersContext, null, 2)}`);

    const systemInstruction =
      "Eres el asistente inteligente de OCrigin. Tu única fuente de verdad es la información suministrada en la sección [CONTEXTO DE LA OBRA]. " +
      "REGLAS DE NEGOCIO: 1. Responde de forma resumida, literaria y estrictamente apegada al contexto. " +
      "2. Si el usuario te pregunta por algo que no está en el contexto, di estrictamente: " +
      "\"Esa información no existe en tu base de datos actual o aún no ha sido registrada.\"";

    const contextString = charactersContext.map(char =>
      `Nombre completo: ${char.fullName}\n` +
      `Lugar de origen: ${char.origin}\n` +
      `Rol narrativo: ${char.role}\n` +
      `Biografía actual: ${char.description}\n` +
      `Ocupación: ${char.occupation}\n` +
      `Estado civil: ${char.maritalStatus}\n`
    ).join('\n---\n');

    const promptConsolidado =
      `[CONTEXTO DE LA OBRA]\n${contextString || 'No hay personajes registrados con ese nombre.'}\n\n` +
      `[PREGUNTA DEL AUTOR]\n${queryText}`;

    console.log(`\n[TRACE 3 - CONSOLIDATED PROMPT SENT TO GOOGLE AI STUDIO]`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`   System Instructions: "${systemInstruction}"`);
    console.log(`   Final Consolidated Payload sent to Gemini API:\n"""\n${promptConsolidado}\n"""`);

    if (!model) {
      throw new Error('Servicio de IA no inicializado.');
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptConsolidado }] }],
      generationConfig: {
        systemInstruction: systemInstruction
      }
    });

    const responseText = result.response.text().trim();

    console.log(`\n================================================================================`);
    console.log(`[TRACE END - API STATUS: 200 OK]`);
    console.log(`   Text Response: "${responseText}"`);
    console.log(`================================================================================\n`);

    return res.status(200).json({
      success: true,
      data: responseText
    });

  } catch (error) {
    console.error(`\n================================================================================`);
    console.error(`[TRACE END - ERROR DETECTED]`);
    console.error(`   Error Stack: ${error.message}`);
    console.error(`================================================================================\n`);

    const isRateLimit =
      error.status === 429 ||
      error.code === 429 ||
      (error.message && error.message.includes('429')) ||
      (error.message && error.message.includes('RESOURCE_EXHAUSTED'));

    if (isRateLimit) {
      console.warn('⚠️ [SERVIDOR]: Límite de cuota de Gemini alcanzado (Error 429).');
      return res.status(429).json({
        success: false,
        error: 'Límite de solicitudes alcanzado (Exigencia 5)',
        message: 'Se ha superado temporalmente la cuota permitida de la IA. Por favor, espera unos segundos e intenta nuevamente.',
        details: error.message
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Error de orquestación interna',
      details: error.message
    });
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
      return res.status(404).json({ error: 'Personaje no encontrado o no posees los permisos necesarios.' });
    }
    res.json({ success: true, message: 'Personaje eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el personaje.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor de OCrigin corriendo en http://localhost:${PORT}`);
});