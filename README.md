
# Task Manager

Полнофункциональное веб-приложение для управления задачами с аутентификацией пользователей. 

**Репозиторий:** https://github.com/skkkystyle/task-manager.git

## Содержание

- [Описание проекта](#описание-проекта)
- [Технологии](#технологии)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)

## Описание проекта

Task Manager — это веб-приложение для управления задачами, которое позволяет:

- Регистрироваться и входить в систему
- Создавать, редактировать и удалять задачи
- Фильтровать задачи по статусу (К выполнению, В процессе, Выполнено)
- Искать задачи по названию

## Технологии

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Frontend | React + TypeScript | 19.x |
| UI библиотека | Mantine | 8.x |
| Backend | NestJS | 11.x |
| ORM | Prisma | 7.x |
| База данных | PostgreSQL | 17 |
| Контейнеризация | Docker + Docker Compose | 24. x / 2.x |
| Веб-сервер | Nginx | 1.27 |
| Runtime | Node.js | 22 LTS |

## Требования

Для запуска проекта необходимо установить:

| Программа | Минимальная версия | Ссылка для скачивания |
|-----------|-------------------|----------------------|
| Docker | 24.0+ | https://docs.docker.com/get-docker/ |
| Docker Compose | 2.0+ | Включён в Docker Desktop |
| Git | 2.0+ | https://git-scm.com/downloads |

### Проверка установки

```bash
docker --version        # Docker version 24.x.x
docker-compose --version # Docker Compose version v2.x.x
git --version           # git version 2.x.x
```

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/skkkystyle/task-manager.git
cd task-manager
```

### 2. Запуск приложения

```bash
docker-compose up --build
```

### 3. Открытие приложения

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

### 4. Остановка приложения

```bash
docker-compose down
```

Для удаления данных базы: 

```bash
docker-compose down -v
```

### Расположение ключевых файлов

| Файл | Путь | Описание |
|------|------|----------|
| Docker Compose | `docker-compose.yml` | Оркестрация контейнеров |
| Backend Dockerfile | `backend/Dockerfile` | Сборка backend |
| Frontend Dockerfile | `frontend/Dockerfile` | Сборка frontend |
| Миграции БД | `backend/prisma/migrations/` | SQL скрипты миграций |
| Схема БД | `backend/prisma/schema.prisma` | Prisma схема |


## Переменные окружения

Приложение использует переменные окружения с значениями по умолчанию:

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `POSTGRES_USER` | postgres | Пользователь БД |
| `POSTGRES_PASSWORD` | postgres | Пароль БД |
| `POSTGRES_DB` | task_manager | Имя базы данных |
| `JWT_SECRET` | change-this-in-production | Секрет для JWT |
| `JWT_EXPIRES_IN` | 7d | Время жизни токена |

Для production создайте файл `.env` в корне проекта:

```env
POSTGRES_USER=myuser
POSTGRES_PASSWORD=securepassword
POSTGRES_DB=task_manager
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=7d
```
