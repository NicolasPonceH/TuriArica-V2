import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Groq from 'groq-sdk';
import { dbOperations } from '../db.js';
import { getLiveWeather } from './weather.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

const router = Router();

// Reglas e instrucciones estrictas solicitadas para el Asistente Turístico de Arica
const STRICT_SYSTEM_PROMPT = `Eres un asistente turístico de Arica y la región de Arica y Parinacota.

Reglas estrictas:
1. Responde ÚNICAMENTE con base en la información que se te proporcione en el campo "contexto".
2. Si la pregunta no se puede responder con esa información, di claramente: 
   "No tengo suficiente información para responder eso con certeza."
3. No inventes direcciones, horarios, precios, nombres de lugares ni rutas de locomoción.
4. Si el usuario pide recomendaciones, usa solo los sitios y datos que aparezcan en el contexto.
5. Responde en español, de forma clara, amable y concreta (máx. 6–8 líneas, salvo que se pida más detalle).
6. Cuando des direcciones o cómo llegar, sé específico (nombre de paradas, líneas de micro, puntos de referencia) pero solo si están en el contexto.
7. Si hay varios lugares que cumplen, enumera hasta 3 opciones como máximo, con nombre y una frase de por qué recomendarlos.
8. En ningún caso menciones qué modelo de IA eres ni hagas alusión a OpenAI, Groq u otras tecnologías. Preséntate y actúa siempre como el asistente turístico de Arica.`;

// Función auxiliar para compilar el contexto oficial desde MySQL/SQLite y RedMeteo
async function buildOfficialContext() {
  const places = await dbOperations.getAllPlaces();
  const events = await dbOperations.getActiveEvents();

  let weatherText = '';
  try {
    const weather = await getLiveWeather();
    if (weather && weather.current) {
      weatherText = `\n\n--- CONDICIÓN METEOROLÓGICA Y CLIMA EN TIEMPO REAL (ESTACIÓN CAPITANÍA DE PUERTO ARICA) ---
- Temperatura actual: ${weather.current.temp}°C
- Humedad relativa: ${weather.current.humidity}%
- Viento actual: ${weather.current.windSpeedKmH} km/h (Dirección ${weather.current.windDirection})
- Radiación solar: ${weather.current.solarRadiation !== null ? `${weather.current.solarRadiation} W/m²` : 'N/A'}
- Índice de radiación UV: ${weather.current.uvIndex}
- Fuente oficial: Red Meteorológica Aficionada de Chile (RedMeteo.cl), Estación ${weather.station.name} (${weather.station.code}).`;
    }
  } catch (e) {
    // Si falla el clima, continuar sin interrumpir el contexto
  }

  const placesContext = places.map(p => {
    const busLines = p.transport?.lineas?.length ? p.transport.lineas.join(', ') : 'No especificada';
    const parada = p.transport?.parada || 'N/A';
    const direccion = p.transport?.direccion || '';
    const letrero = p.transport?.letrero || '';
    const acc = p.accessibility || {};
    const accText = `Silla de ruedas: ${acc.wheelchair ? 'Sí' : 'No'} | Rampas: ${acc.ramps ? 'Sí' : 'No'} | Baños adaptados: ${acc.adaptedBathrooms ? 'Sí' : 'No'}${acc.notes ? ` (${acc.notes})` : ''}`;

    return `### ${p.name} (Categoría: ${p.category} | Tipo: ${p.type})
- Descripción: ${p.fullDesc || p.shortDesc}
- Ubicación: Latitud ${p.lat}, Longitud ${p.lng}
- Cómo llegar / Locomoción: Micros [${busLines}]. Parada: ${parada}. Dirección/Letrero: ${letrero || direccion || 'N/A'}. Indicaciones adicionales: ${p.directions || 'Ver mapa'}.
- Horarios: ${p.hours || 'Sin horario especificado'}
- Tarifas / Entrada: ${p.entryFee || p.priceRange || 'Gratuito / Acceso libre'}
- Mejor momento para visitar: ${p.bestTime || 'Cualquier momento del día'}
- Consejos prácticos del guía: ${p.tips || 'Disfrutar con responsabilidad'}
- Accesibilidad Universal: ${accText}
- Teléfono / Contacto: ${p.phone || 'N/A'} | Web: ${p.website || 'N/A'}
- Etiquetas de búsqueda: ${(p.aiTags || []).join(', ')}`;
  }).join('\n\n');

  const eventsContext = events.length > 0 ? events.map(e => {
    return `### [EVENTO O ALERTA ACTIVA] ${e.title} (${e.type.toUpperCase()})
- Mensaje: ${e.message}
- Fechas: Desde ${e.startDate || 'Ahora'} hasta ${e.endDate || 'Fin de temporada'}
- Más info: ${e.actionUrl || 'Consultar en la app'}`;
  }).join('\n\n') : 'No hay alertas ni eventos especiales vigentes en este momento.';

  return {
    text: `--- LUGARES TURÍSTICOS, PATRIMONIALES Y SERVICIOS EN ARICA ---\n${placesContext}\n\n--- EVENTOS Y AVISOS OFICIALES ---\n${eventsContext}${weatherText}`,
    places,
    events
  };
}

// 1. Obtener contexto completo para alimentar una IA (RAG / System Prompt / Context Injection)
router.get('/context', async (req, res) => {
  try {
    const { text, places, events } = await buildOfficialContext();
    res.json({
      systemPrompt: STRICT_SYSTEM_PROMPT,
      context: text,
      summary: {
        totalPlaces: places.length,
        activeEvents: events.length,
        categories: [...new Set(places.map(p => p.category))]
      },
      places,
      events
    });
  } catch (error) {
    console.error('Error al generar contexto para IA:', error);
    res.status(500).json({ error: 'Error al compilar el contexto turístico.' });
  }
});

// 2. Chatbot con Groq AI (modelo openai/gpt-oss-20b con streaming SSE o respuesta JSON)
router.post('/chat', async (req, res) => {
  try {
    const { question, stream = false, groqApiKey, model = 'openai/gpt-oss-20b', history = [] } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'La pregunta no puede estar vacía.' });
    }

    const apiKey = groqApiKey || process.env.GROQ_API_KEY;
    const { text: contextText, places, events } = await buildOfficialContext();

    // Si no hay API Key de Groq configurada, avisar y ofrecer respuesta de la base de datos
    if (!apiKey) {
      if (stream) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        const msg = "⚠️ Para activar el modelo 'openai/gpt-oss-20b' con Groq, ingresa tu API Key en la barra superior o en el archivo server/.env (GROQ_API_KEY=tu_clave). Mientras tanto, te respondo con la base de datos local:";
        res.write(`data: ${JSON.stringify({ chunk: msg + "\n\n" })}\n\n`);

        const fallback = generateDatabaseFallback(question, places, events);
        res.write(`data: ${JSON.stringify({ chunk: fallback })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        return res.end();
      }

      return res.json({
        answer: generateDatabaseFallback(question, places, events),
        needsApiKey: true,
        model: 'database-grounded-fallback',
        notice: "Configura GROQ_API_KEY en server/.env o en el modal para usar 'openai/gpt-oss-20b'."
      });
    }

    // Inicializar cliente Groq
    const groq = new Groq({ apiKey });

    // Armar mensajes respetando las reglas estrictas del usuario
    const messages = [
      {
        role: 'system',
        content: STRICT_SYSTEM_PROMPT
      }
    ];

    // Incluir hasta 4 mensajes de historial reciente si existen
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-4)) {
        if (h.role && h.content) {
          messages.push({ role: h.role === 'bot' ? 'assistant' : 'user', content: h.content });
        }
      }
    }

    // Mensaje de usuario con el contexto inyectado
    messages.push({
      role: 'user',
      content: `Contexto:\n${contextText}\n\nPregunta:\n${question.trim()}`
    });

    // Parámetros de llamada a Groq
    const requestPayload = {
      model,
      messages,
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1
    };

    // Si el modelo admite reasoning_effort
    if (model.includes('gpt-oss') || model.includes('o1') || model.includes('o3')) {
      requestPayload.reasoning_effort = 'medium';
    }

    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      try {
        let groqStream;
        try {
          groqStream = await groq.chat.completions.create({
            ...requestPayload,
            stream: true
          });
        } catch (firstErr) {
          // Si el modelo openai/gpt-oss-20b no está habilitado para esta key, intentar con llama-3.3-70b-versatile
          console.warn(`[GROQ] Falló con modelo ${model}: ${firstErr.message}. Reintentando con llama-3.3-70b-versatile...`);
          groqStream = await groq.chat.completions.create({
            ...requestPayload,
            model: 'llama-3.3-70b-versatile',
            stream: true
          });
        }

        for await (const chunk of groqStream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            res.write(`data: ${JSON.stringify({ chunk: delta })}\n\n`);
          }
        }

        res.write(`data: [DONE]\n\n`);
        return res.end();
      } catch (streamError) {
        console.error('[GROQ STREAM ERROR]', streamError);
        res.write(`data: ${JSON.stringify({ chunk: `\n\n❌ Error de Groq: ${streamError.message}` })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        return res.end();
      }
    }

    // Modo no-stream (JSON estándar)
    let completion;
    try {
      completion = await groq.chat.completions.create({
        ...requestPayload,
        stream: false
      });
    } catch (firstErr) {
      console.warn(`[GROQ] Falló con modelo ${model}: ${firstErr.message}. Reintentando con llama-3.3-70b-versatile...`);
      completion = await groq.chat.completions.create({
        ...requestPayload,
        model: 'llama-3.3-70b-versatile',
        stream: false
      });
    }

    const answer = completion.choices[0]?.message?.content || 'No se pudo generar respuesta.';

    res.json({
      answer,
      model: completion.model || model,
      usage: completion.usage
    });
  } catch (error) {
    console.error('Error al consultar chat con IA:', error);
    res.status(500).json({
      error: 'Error al procesar la respuesta con Groq.',
      details: error.message
    });
  }
});

// 3. Endpoint de configuración para guardar/verificar GROQ_API_KEY
router.post('/config', (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || !apiKey.trim().startsWith('gsk_')) {
      return res.status(400).json({ error: 'La API Key debe comenzar con gsk_.' });
    }

    process.env.GROQ_API_KEY = apiKey.trim();

    // Actualizar server/.env si existe
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf-8');
      if (content.includes('GROQ_API_KEY=')) {
        content = content.replace(/GROQ_API_KEY=.*/g, `GROQ_API_KEY=${apiKey.trim()}`);
      } else {
        content += `\nGROQ_API_KEY=${apiKey.trim()}\nGROQ_MODEL=openai/gpt-oss-20b\n`;
      }
      fs.writeFileSync(envPath, content, 'utf-8');
    }

    res.json({ success: true, message: 'GROQ_API_KEY guardada exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar la clave API.' });
  }
});

// 4. Fallback semántico basado estrictamente en la base de datos de Arica
function generateDatabaseFallback(question, places, events) {
  const q = question.toLowerCase().trim();

  // Búsqueda en nombre, categoría, descripción y transporte
  const matches = places.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(q);
    const catMatch = p.category.toLowerCase().includes(q);
    const descMatch = (p.fullDesc || '').toLowerCase().includes(q);
    const busMatch = (p.transport?.lineas || []).some(l => q.includes(l.toLowerCase()));
    const tagMatch = (p.aiTags || []).some(t => q.includes(t.toLowerCase()));
    return nameMatch || catMatch || descMatch || busMatch || tagMatch;
  });

  if (matches.length > 0) {
    const top = matches.slice(0, 3);
    let out = top.map((p, idx) => {
      const bus = p.transport?.lineas?.length ? p.transport.lineas.join(', ') : 'N/A';
      return `${idx + 1}. **${p.name}** (${p.category}): ${p.shortDesc || p.fullDesc.slice(0, 150)}...\n   - 🚌 Micros: Línea ${bus} (Parada: ${p.transport?.parada || 'N/A'})\n   - 🕒 Horario: ${p.hours || 'Abierto todo el año'}`;
    }).join('\n\n');

    return out;
  }

  // Si la pregunta claramente no es de Arica (Regla 2 estricta)
  const isAricaRelated = ['arica', 'morro', 'playa', 'chinchorro', 'laucho', 'lisera', 'machas', 'momia', 'anzota', 'lluta', 'museo', 'micro', 'agro', 'azapa'].some(term => q.includes(term));
  if (!isAricaRelated) {
    return 'No tengo suficiente información para responder eso con certeza.';
  }

  return 'No tengo suficiente información en el contexto actual para responder con certeza sobre ese sitio específico.';
}

export default router;
