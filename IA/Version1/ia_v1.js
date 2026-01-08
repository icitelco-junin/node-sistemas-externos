const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const fs = require('fs');
require('dotenv').config();

// Asegúrate de tener OPENAI_API_KEY en tu archivo .env
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Endpoint para crear (o recrear) un archivo en un Vector Store de OpenAI.
 * Si ya existen archivos, los elimina todos antes de subir el nuevo.
 */
router.post("/crear_vector_file", async (req, res) => {
    try {
        const { vectorStoreId, filePath } = req.body;

        if (!vectorStoreId || !filePath) {
            return res.status(400).json({ message: "Parámetros faltantes: se requieren vectorStoreId y filePath." });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(400).json({ message: `No existe el archivo local: ${filePath}` });
        }

        // --- Funciones auxiliares ---

        const listVectorFiles = async (storeId) => {
            const fileList = await openai.beta.vectorStores.files.list(storeId);
            return fileList.data;
        };

        const deleteAllFiles = async (storeId) => {
            const files = await listVectorFiles(storeId);
            if (files.length === 0) return 0;

            const deletePromises = files.map(file =>
                openai.beta.vectorStores.files.del(storeId, file.id)
            );
            await Promise.all(deletePromises);
            return files.length;
        };

        const uploadAndAssociateFile = async (storeId, filepath) => {
            const fileStream = fs.createReadStream(filepath);
            const file = await openai.files.create({
                file: fileStream,
                purpose: 'assistants',
            });

            await openai.beta.vectorStores.files.create(storeId, {
                file_id: file.id,
            });
            
            // El SDK de Node no tiene un método "poll" directo para la asociación.
            // La asociación usualmente es rápida, pero en un escenario de producción
            // se podría implementar un polling manual aquí si fuera necesario.
            return file.id;
        };

        // --- Lógica principal del endpoint ---
        
        await deleteAllFiles(vectorStoreId);
        const fileId = await uploadAndAssociateFile(vectorStoreId, filePath);

        res.json({ status: "success", file_id: fileId });

    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: e.message });
    }
});

/**
 * Endpoint para interactuar con un Asistente de OpenAI usando RAG.
 * Utiliza un hilo de conversación para mantener el contexto.
 */
router.post("/menu-rag", async (req, res) => {
    try {
        const { query, thread_id } = req.body;
        const assistant_id = "asst_5RsqEr0p8DqIMAjaeBTdCsRf"; // ID del asistente

        if (!query) {
             return res.status(400).json({ message: "Parámetro faltante: se requiere query." });
        }
        
        const threadId = thread_id || (await openai.beta.threads.create()).id;

        await openai.beta.threads.messages.create(
            threadId,
            { role: "user", content: query }
        );

        // Usamos createAndPoll para crear la ejecución y esperar a que se complete
        const run = await openai.beta.threads.runs.createAndPoll(
            threadId,
            { assistant_id }
        );
        
        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(threadId, { order: 'desc', limit: 1 });
            const assistantResponse = messages.data[0].content[0].text.value;
            
            let formattedResponse;
            try {
                // Intentamos parsear la respuesta por si es un JSON, como en el código Python
                formattedResponse = JSON.parse(assistantResponse);
            } catch (error) {
                formattedResponse = assistantResponse;
            }

            res.json({
                status: "success",
                response: formattedResponse,
                thread_id: threadId
            });
        } else {
            res.status(500).json({
                status: "error",
                error: `Run failed with status: ${run.status}`,
                details: run.last_error ? run.last_error.message : "No details provided"
            });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: e.message });
    }
});

module.exports = router;