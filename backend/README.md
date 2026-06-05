# NzolaNet Backend

API Laravel usada pelo frontend do NzolaNet. O backend expõe endpoints JSON para autenticação, perfis, publicações, comentários, seguidores e feed.

## Estrutura Principal

- `app/Http/Controllers`: recebe as requisições HTTP, chama os services e devolve JSON.
- `app/Http/Requests`: valida os dados de entrada antes de chegarem ao controller.
- `app/Services`: contém a lógica de negócio da API.
- `app/Repositories`: concentra as queries Eloquent usadas pelos services.
- `app/DTOs`: define o formato dos dados que entram ou saem da API.
- `routes/api.php`: lista os endpoints da API.

## Lógicas Mais Importantes da API

### Autenticação com Sanctum

No login, o backend procura o utilizador pelo email e compara a senha enviada com a senha guardada usando `Hash::check`.

Se as credenciais estiverem certas, é criado um token Sanctum:

```php
$user->createToken('nzolanet-api-token')->plainTextToken
```

Esse token é devolvido ao frontend. Depois disso, o frontend envia o token nas próximas requisições autenticadas. A decisão aqui foi usar autenticação por token porque o frontend e o backend são separados.

### Senhas com Hash

A senha nunca é guardada em texto puro na base de dados. No registo e na recuperação de senha, o backend usa:

```php
Hash::make($password)
```

Assim, mesmo que alguém aceda à base de dados, não encontra a senha original do utilizador.

### Recuperação de Senha

O fluxo de recuperação de senha tem duas partes.

Primeiro, o frontend chama:

```http
POST /api/auth/forgot-password
```

com o email do utilizador. O backend valida o email e procura o utilizador. Se o email não existir, a API simplesmente retorna sem erro. A resposta continua genérica:

```txt
Se o email existir, enviaremos um token de recuperação.
```

Essa decisão evita revelar se um email está registado ou não.

Se o utilizador existir, o Laravel cria um token de recuperação:

```php
Password::broker()->createToken($user)
```

Depois o token é enviado por email com `Mail::raw`.

Na segunda parte, o frontend chama:

```http
POST /api/auth/reset-password
```

enviando `email`, `token`, `password` e `password_confirmation`. O Laravel valida o token com `Password::broker()->reset`. Se estiver válido, a nova senha é guardada com hash e todos os tokens antigos do utilizador são removidos:

```php
$user->tokens()->delete();
```

Essa decisão força logout das sessões antigas depois de trocar a senha.

### Upload de Foto de Perfil

A foto de perfil não é guardada directamente na base de dados. A imagem real é guardada no storage público do Laravel, e a base de dados guarda apenas o caminho da imagem.

O frontend envia a foto em `FormData` para:

```http
POST /api/users/profile-photo
```

com o campo `photo`.

O request `ChangeProfilePhotoRequest` valida:

- o campo `photo` é obrigatório;
- precisa ser imagem;
- aceita `jpg`, `jpeg`, `png` e `webp`;
- limite de 2MB.

No service, o ficheiro é guardado assim:

```php
$path = $photo->store('profile-photos', 'public');
```

Essa linha guarda a imagem na pasta `profile-photos` dentro do disco `public`. O valor retornado é o caminho, por exemplo:

```txt
profile-photos/nome-gerado.jpg
```

Esse caminho é guardado no campo `profile_photo` do utilizador.

Antes de actualizar, o código guarda a foto antiga. Depois de guardar a nova foto, remove a anterior:

```php
Storage::disk('public')->delete($previousPhoto);
```

A decisão foi guardar ficheiros no storage e apenas o caminho na base de dados. Isso mantém a base de dados leve e evita acumular imagens antigas sem uso.

### Permissão para Alterar ou Apagar Publicações

O backend não confia no frontend para decidir quem pode apagar ou editar uma publicação.

Quando alguém tenta alterar ou apagar um post, o service carrega o post e verifica se o dono do post é o utilizador autenticado:

```php
if ($post->user_id !== $author->id) {
    throw new AuthorizationException('Não tem permissão para alterar esta publicação.');
}
```

Se os IDs forem diferentes, a API bloqueia a acção. Essa decisão garante que um utilizador só consegue gerir os próprios posts, mesmo que tente chamar a API manualmente.

### Permissão para Alterar ou Apagar Comentários

A lógica dos comentários segue a mesma ideia dos posts. O comentário tem um `user_id`, e o service compara esse valor com o ID do utilizador autenticado.

Se o comentário não pertencer ao utilizador logado, a API lança uma excepção de autorização.

### Perfis Privados

Ao listar posts de um perfil, o backend verifica a privacidade do perfil.

Se o perfil é privado, outro utilizador só pode ver os posts se já seguir esse perfil. A regra é:

- o dono do perfil pode ver os próprios posts;
- seguidores podem ver posts de perfil privado;
- outros utilizadores recebem erro de autorização.

Essa regra fica no backend para impedir que alguém contorne a interface do frontend e aceda aos posts directamente pela API.

### Sugestões de Utilizadores

As sugestões de perfis são geradas no backend. O sistema remove o próprio utilizador da lista, evita sugerir perfis que ele já segue e ordena por quantidade de seguidores.

A decisão foi deixar a regra no backend porque a API sabe consultar relações como seguidores, seguindo e contadores de forma mais segura.

### Paginação e Limite de Resultados

Feed, comentários, seguidores e seguindo usam paginação.

Mesmo que o frontend envie `per_page`, o backend limita o valor:

```php
max(1, min($perPage, 50))
```

Isso impede pedidos exagerados, como `per_page=100000`, que poderiam deixar a API lenta.

### DTOs de Resposta

A API não devolve directamente os models Eloquent completos. Ela usa DTOs como:

- `CurrentUserDTO`
- `UserDTO`
- `PostDTO`
- `CommentDTO`

Esses DTOs escolhem exactamente quais campos vão para o frontend. A decisão evita expor dados desnecessários e mantém o contrato da API mais estável.

## Validação

Para verificar as rotas da API:

```bash
php artisan route:list --path=api
```

Para executar os testes:

```bash
composer test
```
