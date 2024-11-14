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


// Обработка запросов на получение файла с Яндекс.Диска
app.get('/disk/*', async (req, res) => {
    try {
        const filePath = req.path.replace('/disk', ''); // Убираем /disk из пути
        const yandexUrl = `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(filePath)}`;

        // Запрашиваем ссылку для скачивания файла у Яндекс.Диска
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

        // Делаем запрос по полученной ссылке для скачивания файла
        const downloadResponse = await fetch(downloadUrl);
        if (!downloadResponse.ok) {
            throw new Error(`Ошибка при скачивании файла: ${downloadResponse.statusText}`);
        }

        // Проверка типа контента
        const contentType = downloadResponse.headers.get('content-type');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('application/json')) {
            // Если файл текстовый (JSON), обрабатываем его как JSON
            const jsonData = await downloadResponse.json();
            res.json(jsonData);
        } else {
            // Если файл является изображением или другим бинарным файлом, передаем потоковые данные напрямую
            res.setHeader('Content-Disposition', 'inline');
            downloadResponse.body.pipe(res);
        }
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