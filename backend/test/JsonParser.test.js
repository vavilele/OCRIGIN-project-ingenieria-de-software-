/**
 * OCrigin - Suite de Pruebas Unitarias Automatizadas
 * Validaciones semánticas para el parser de JSON tradicional de la IA.
 * * Testea la resiliencia del middleware frente a fallos sintácticos en Node.js utilizando Jest.
 */

const { parseGeminiJSON } = require('../utils/jsonParser');

describe('Suite de Pruebas Unitarias: Validador de JSON de Gemini (OCrigin Backend)', () => {

    // Caso de Prueba 1: Formato JSON estándar e impecable
    test('CP-01: Debe parsear con éxito un JSON limpio sin delimitadores', () => {
        const rawInput = '{"fullName": "Aria Pendragon", "role": "Protagonista", "age": "19"}';
        const result = parseGeminiJSON(rawInput);

        expect(result).toBeDefined();
        expect(result.fullName).toBe("Aria Pendragon");
        expect(result.role).toBe("Protagonista");
        expect(result.age).toBe("19");
    });

    // Caso de Prueba 2: Markdown de triple comilla generado comúnmente por los LLMs
    test('CP-02: Debe sanitizar de forma limpia el envoltorio de Markdown ```json y parsear el contenido', () => {
        const rawInput = '```json\n{"fullName": "Garrick", "role": "Mentor", "origin": "Camelot"}\n```';
        const result = parseGeminiJSON(rawInput);

        expect(result).toBeDefined();
        expect(result.fullName).toBe("Garrick");
        expect(result.role).toBe("Mentor");
        expect(result.origin).toBe("Camelot");
    });

    // Caso de Prueba 3: Simular una respuesta rota o texto libre que no es JSON (Estrés de sintaxis)
    test('CP-03: Debe capturar y lanzar un SyntaxError controlado si la IA responde con texto plano no estructurado', () => {
        const malformedInput = 'Claro, aquí tienes la ficha de Aria: Nombre: Aria, Rol: Protagonista.';

        // Verificamos que la función capture el fallo y lance la excepción SyntaxError sin tumbar el hilo de Node.js
        expect(() => {
            parseGeminiJSON(malformedInput);
        }).toThrow(SyntaxError);

        // Mensaje descriptivo de la excepción para trazabilidad
        try {
            parseGeminiJSON(malformedInput);
        } catch (e) {
            expect(e.message).toContain("Error de sintaxis de IA");
        }
    });

    // Caso de Prueba 4: Valores nulos o nulos implícitos
    test('CP-04: Debe arrojar un SyntaxError de argumento vacío si la respuesta es nula, indefinida o vacía', () => {
        expect(() => parseGeminiJSON(null)).toThrow(SyntaxError);
        expect(() => parseGeminiJSON(undefined)).toThrow(SyntaxError);
        expect(() => parseGeminiJSON("   ")).toThrow(SyntaxError);
    });

});