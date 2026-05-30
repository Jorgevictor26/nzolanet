# NzolaNet

A NzolaNet é uma plataforma de rede social moderna desenvolvida com Angular, Laravel e MySQL. A aplicação permite que os utilizadores criem e partilhem publicações, interajam através de bazes e comentários, sigam outros utilizadores e recebam notificações sobre atividades relacionadas com os seus conteúdos.

## Tecnologias Utilizadas

### Frontend
- Angular
- TypeScript
- HTML5
- CSS3

### Backend
- Laravel
- API REST
- Laravel Sanctum

### Base de Dados
- MySQL

## Funcionalidades Principais

### Gestão de Utilizadores
- Registo de utilizadores
- Login e Logout
- Recuperação de senha
- Edição de perfil
- Alteração da foto de perfil
- Perfis públicos e privados
- Seguir e deixar de seguir utilizadores

### Publicações
- Criar publicações
- Editar publicações próprias
- Excluir publicações próprias
- Adicionar conteúdo textual
- Upload de imagens
- Upload de vídeos
- Visualização de publicações em ordem cronológica

### Bazes
- Dar baze em publicações
- Remover baze
- Visualizar quantidade de bazes
- Impedir múltiplos bazes do mesmo utilizador na mesma publicação

### Comentários
- Adicionar comentários
- Editar comentários próprios
- Excluir comentários próprios
- Visualizar comentários de uma publicação

### Feed de Notícias
- Feed principal com publicações recentes
- Publicações de utilizadores seguidos
- Ordenação cronológica

### Notificações
- Notificação de novos bazes
- Notificação de novos comentários
- Notificação de novos seguidores

## Arquitetura do Projeto

O backend segue uma arquitetura em camadas para garantir organização, manutenção e escalabilidade:

- Controllers
- Services
- Repositories
- DTOs (Data Transfer Objects)
- Models
- Middleware

## Estrutura Geral

```text
Frontend (Angular)
        ↓
API REST (Laravel)
        ↓
Base de Dados (MySQL)
