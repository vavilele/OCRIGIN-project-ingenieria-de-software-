/**
 * OCrigin - Utilidad de Ingeniería de Software
 * Analizador y sanitizador seguro de respuestas JSON enviadas por LLMs (Gemini).
 * * Este middleware previene que fallos de sintaxis en el formato no estructurado
 * de la IA puedan provocar una excepción no controlada que tumbe el servidor de producción.
 */

/**
 * Limpia delimitadores de Markdown y parsea un string a un objeto JSON de forma segura.
  @param {string} rawResponse - Texto plano devuelto por la API de Gemini.
  @returns {Object} Objeto JavaScript estructurado y parseado.
  @throws {SyntaxError} Si el formato es inválido o no se puede procesar como JSON.
 
const parseGeminiJSON = (rawResponse) => {
   
    if (!rawResponse || typeof rawResponse !== 'string') {
        throw new SyntaxError("La respuesta recibida está vacía o el formato de origen no es válido.");
    }

    
    let cleanText = rawResponse
        .replace(/^```json\s*/i, '') 
        .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();


try {
    return JSON.parse(cleanText);
} catch (error) {

    throw new SyntaxError(`Error de sintaxis de IA: No se pudo estructurar el contenido como JSON. Detalle: ${error.message}`);
}
};

module.exports = { parseGeminiJSON };