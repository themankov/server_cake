import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
const app = express();
const ACCESS_TOKEN = 'y0_AgAAAABpLP7zAADLWwAAAAEXc6WeAADAQDH86zJKj5USSGa7XLLGVQ44zQ';

// Разрешаем запросы из любых источников (по сути, устраняем CORS на стороне сервера)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// Прокси для запросов к Яндекс.Диску
app.get('/disk/*', async (req, res) => {
    try {
        const filePath = req.path.replace('/disk', ''); // Убираем /disk из пути
        const yandexUrl = `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(filePath)}`;

        // Запрашиваем ссылку для скачивания у Яндекс.Диска
        const yandexResponse = await fetch(yandexUrl, {
            headers: {
                Authorization: `OAuth ${ACCESS_TOKEN}`,
            },
        });

        if (!yandexResponse.ok) {
            throw new Error(`Ошибка при получении ссылки на файл: ${yandexResponse.statusText}`);
        }

        const yandexData = await yandexResponse.json();
        const downloadUrl = yandexData.href;

        // Делаем запрос по полученной ссылке на скачивание
        const downloadResponse = await fetch(downloadUrl);
        const fileData = await downloadResponse.json();

        // Отправляем данные на фронтенд
        res.json(fileData);
    } catch (error) {
        console.error('Ошибка при проксировании запроса:', error);
        res.status(500).json({ error: error.message });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});