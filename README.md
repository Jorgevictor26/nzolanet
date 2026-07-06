# NzolaNet

Rede social academica com backend em Laravel, frontend em Angular e base de dados MySQL.

## Configuracao inicial

Depois de clonar o projeto, configure o backend antes de correr a aplicacao:

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
```

O ficheiro `.env.example` mantem `APP_KEY=` vazio de proposito. Cada ambiente deve gerar a sua propria chave com `php artisan key:generate`.

Para o frontend:

```bash
cd Frontend
npm install
npm start
```

## Nota de seguranca

A autenticacao atual usa Laravel Sanctum com bearer token consumido pelo Angular. O token ainda e mantido no armazenamento do browser para preservar o fluxo existente; antes de producao, deve ser avaliada a migracao para cookies HttpOnly/SameSite com protecao CSRF.
